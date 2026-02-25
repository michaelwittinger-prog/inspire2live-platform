-- ============================================================
-- MIGRATION 00027: Invitation acceptance RPC + inviter notification
--
-- Problem:
--   Invitees cannot insert into initiative_members due to RLS.
--   Accept/decline from /app/notifications updates the invitation but fails
--   to add membership.
--
-- Solution:
--   Provide a SECURITY DEFINER RPC that:
--     - validates invite ownership
--     - updates invitation status
--     - upserts membership rows
--     - notifies inviter ("invitation accepted")
-- ============================================================

create or replace function public.respond_to_invitation(
  inv_id uuid,
  response text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.invitations%rowtype;
  v_initiative_title text;
  v_invitee_name text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if response not in ('accepted', 'declined') then
    raise exception 'Invalid response: %', response;
  end if;

  select * into inv
  from public.invitations
  where id = inv_id;

  if not found then
    raise exception 'Invitation not found';
  end if;

  -- Only the invitee can respond (for in-app invites).
  if inv.invitee_user_id is null or inv.invitee_user_id <> auth.uid() then
    raise exception 'Not authorized to respond to this invitation';
  end if;

  if inv.status <> 'invited' then
    raise exception 'Invitation already responded';
  end if;

  update public.invitations
    set status = response,
        responded_at = now(),
        updated_at = now()
  where id = inv_id;

  if response = 'accepted' then
    if inv.scope = 'initiative' and inv.initiative_id is not null then
      insert into public.initiative_members (
        initiative_id,
        user_id,
        member_role,
        invite_status,
        invited_by,
        invited_at,
        accepted_at
      )
      values (
        inv.initiative_id,
        auth.uid(),
        inv.invitee_role,
        'accepted',
        inv.invited_by,
        inv.invited_at,
        now()
      )
      on conflict (initiative_id, user_id) do update
        set member_role   = excluded.member_role,
            invite_status = 'accepted',
            invited_by    = excluded.invited_by,
            invited_at    = excluded.invited_at,
            accepted_at   = excluded.accepted_at,
            updated_at    = now();

      select title into v_initiative_title
      from public.initiatives
      where id = inv.initiative_id;

      select coalesce(nullif(name, ''), nullif(email, ''), left(id::text, 8))
      into v_invitee_name
      from public.profiles
      where id = auth.uid();

      insert into public.notifications (user_id, type, title, body, is_read, link)
      values (
        inv.invited_by,
        'initiative_joined',
        'Invitation accepted',
        v_invitee_name || ' accepted your invitation to join ' || coalesce(v_initiative_title, 'your initiative') ||
          ' as ' || inv.invitee_role || '.',
        false,
        '/app/initiatives/' || inv.initiative_id::text || '/team'
      );

      return jsonb_build_object(
        'ok', true,
        'scope', inv.scope,
        'initiative_id', inv.initiative_id,
        'congress_id', null
      );
    end if;

    if inv.scope = 'congress' and inv.congress_id is not null then
      insert into public.congress_members (
        congress_id,
        user_id,
        member_role,
        invite_status,
        invited_by,
        invited_at,
        accepted_at
      )
      values (
        inv.congress_id,
        auth.uid(),
        inv.invitee_role,
        'accepted',
        inv.invited_by,
        inv.invited_at,
        now()
      )
      on conflict (congress_id, user_id) do update
        set member_role   = excluded.member_role,
            invite_status = 'accepted',
            invited_by    = excluded.invited_by,
            invited_at    = excluded.invited_at,
            accepted_at   = excluded.accepted_at,
            updated_at    = now();

      select coalesce(nullif(name, ''), nullif(email, ''), left(id::text, 8))
      into v_invitee_name
      from public.profiles
      where id = auth.uid();

      insert into public.notifications (user_id, type, title, body, is_read, link)
      values (
        inv.invited_by,
        'congress_role_assigned',
        'Invitation accepted',
        v_invitee_name || ' accepted your invitation to join the congress as ' || inv.invitee_role || '.',
        false,
        '/app/congress'
      );

      return jsonb_build_object(
        'ok', true,
        'scope', inv.scope,
        'initiative_id', null,
        'congress_id', inv.congress_id
      );
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'scope', inv.scope,
    'initiative_id', inv.initiative_id,
    'congress_id', inv.congress_id
  );
end;
$$;

revoke all on function public.respond_to_invitation(uuid, text) from public;
grant execute on function public.respond_to_invitation(uuid, text) to authenticated;

notify pgrst, 'reload schema';
