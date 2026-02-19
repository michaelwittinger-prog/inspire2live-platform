-- ============================================================
-- MIGRATION 00003: STORAGE BUCKETS
-- File storage configuration for evidence, avatars, and compliance docs
-- ============================================================

-- Create storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'evidence-documents',
    'evidence-documents',
    false,  -- private: access controlled by RLS
    52428800, -- 50MB limit
    array[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/mp4',
      'application/zip'
    ]
  ),
  (
    'avatars',
    'avatars',
    true,  -- public: profile photos are visible to all
    5242880, -- 5MB limit
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ]
  ),
  (
    'compliance-docs',
    'compliance-docs',
    false, -- private: partner compliance documents
    52428800, -- 50MB limit
    array[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ]
  )
on conflict (id) do nothing;

-- ============================================================
-- STORAGE RLS POLICIES
-- ============================================================

-- evidence-documents: Read — initiative members + coordinators + admins
create policy "evidence_read" on storage.objects
  for select using (
    bucket_id = 'evidence-documents' and (
      public.is_initiative_member(
        (storage.foldername(name))[1]::uuid
      ) or
      public.is_coordinator_or_admin()
    )
  );

-- evidence-documents: Write — authenticated initiative members
create policy "evidence_write" on storage.objects
  for insert with check (
    bucket_id = 'evidence-documents' and
    auth.uid() is not null and
    public.is_initiative_member(
      (storage.foldername(name))[1]::uuid
    )
  );

-- evidence-documents: Delete — uploader or coordinator/admin
create policy "evidence_delete" on storage.objects
  for delete using (
    bucket_id = 'evidence-documents' and (
      (storage.foldername(name))[2] = auth.uid()::text or
      public.is_coordinator_or_admin()
    )
  );

-- avatars: Read — public (bucket is public, but policy for belt-and-suspenders)
create policy "avatar_read" on storage.objects
  for select using (bucket_id = 'avatars');

-- avatars: Write — users can upload their own avatar (folder named by user id)
create policy "avatar_upload" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- avatars: Update — users can replace their own avatar
create policy "avatar_update" on storage.objects
  for update using (
    bucket_id = 'avatars' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- avatars: Delete — users can delete their own avatar
create policy "avatar_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- compliance-docs: Read — partner who uploaded + coordinators + admins + board
create policy "compliance_read" on storage.objects
  for select using (
    bucket_id = 'compliance-docs' and (
      (storage.foldername(name))[1] = auth.uid()::text or
      public.is_coordinator_or_admin() or
      public.current_user_role() = 'BoardMember'
    )
  );

-- compliance-docs: Write — partners only
create policy "compliance_write" on storage.objects
  for insert with check (
    bucket_id = 'compliance-docs' and
    auth.uid() is not null and
    public.current_user_role() = 'IndustryPartner'
  );
