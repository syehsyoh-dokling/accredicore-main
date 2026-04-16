#!/bin/bash

# Supabase Storage Buckets Setup Script
# Run this script to create all required storage buckets and RLS policies

echo "🚀 Setting up Supabase Storage Buckets..."

# Login to Supabase (if not already logged in)
echo "📝 Please ensure you're logged in to Supabase CLI:"
echo "supabase login"
echo ""

# Link to your project
echo "🔗 Linking to project..."
supabase link --project-ref advromlqmbjgpiusejvr

echo "📁 Creating storage buckets..."

# Create Documents bucket (private)
echo "Creating 'documents' bucket..."
supabase storage create documents --public=false

# Create Images bucket (public)
echo "Creating 'images' bucket..."
supabase storage create images --public=true

# Create Templates bucket (private)
echo "Creating 'templates' bucket..."
supabase storage create templates --public=false

# Create Resources bucket (private)
echo "Creating 'resources' bucket..."
supabase storage create resources --public=false

echo "✅ Buckets created successfully!"

echo "🔐 Setting up RLS policies via SQL..."

# Create and execute SQL file for RLS policies
cat > /tmp/storage_policies.sql << 'EOF'
-- Documents bucket policies
CREATE POLICY "Documents: Users can view own files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Documents: Users can upload own files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Documents: Users can update own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Documents: Users can delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Documents: Admins can access all files" ON storage.objects
FOR ALL USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_user', 'system_admin')
  )
);

-- Images bucket policies (public read, authenticated upload)
CREATE POLICY "Images: Public access" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Images: Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Images: Users can update own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Images: Users can delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Templates bucket policies
CREATE POLICY "Templates: Authenticated users can view" ON storage.objects
FOR SELECT USING (
  bucket_id = 'templates' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Templates: Admins can manage" ON storage.objects
FOR ALL USING (
  bucket_id = 'templates' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_user', 'system_admin')
  )
);

-- Resources bucket policies
CREATE POLICY "Resources: Authenticated users can view" ON storage.objects
FOR SELECT USING (
  bucket_id = 'resources' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Resources: Users can upload own files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'resources' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Resources: Users can update own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'resources' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Resources: Users can delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'resources' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Resources: Admins can manage all" ON storage.objects
FOR ALL USING (
  bucket_id = 'resources' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_user', 'system_admin')
  )
);

-- Update bucket configurations
UPDATE storage.buckets SET 
  file_size_limit = 52428800, -- 50MB
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
WHERE id = 'documents';

UPDATE storage.buckets SET 
  file_size_limit = 10485760, -- 10MB
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]
WHERE id = 'images';

UPDATE storage.buckets SET 
  file_size_limit = 52428800, -- 50MB
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
WHERE id = 'templates';

UPDATE storage.buckets SET 
  file_size_limit = 104857600, -- 100MB
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'video/mp4'
  ]
WHERE id = 'resources';
EOF

# Execute the SQL policies
supabase db reset --linked
supabase db push

echo "📤 Executing RLS policies..."
supabase db sql --file /tmp/storage_policies.sql

# Clean up
rm /tmp/storage_policies.sql

echo "✅ Storage setup complete!"
echo ""
echo "📋 Summary:"
echo "- documents bucket: Private, 50MB limit, office documents"
echo "- images bucket: Public, 10MB limit, image files"  
echo "- templates bucket: Private, 50MB limit, template files"
echo "- resources bucket: Private, 100MB limit, all file types"
echo ""
echo "🔗 View buckets: https://supabase.com/dashboard/project/advromlqmbjgpiusejvr/storage/buckets"
echo ""
echo "🚀 Ready to upload files!"