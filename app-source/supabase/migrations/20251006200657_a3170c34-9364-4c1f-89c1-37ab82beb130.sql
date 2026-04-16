-- Enable RLS on Team Tables
ALTER TABLE public."Team Table" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Team Members Table" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Docker Tables
ALTER TABLE public.docker_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docker_layers ENABLE ROW LEVEL SECURITY;

-- Policies for Team Table
-- Authenticated users can view active teams
CREATE POLICY "Authenticated users can view teams"
ON public."Team Table"
FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert teams
CREATE POLICY "Admins can insert teams"
ON public."Team Table"
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_user'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

-- Only admins can update teams
CREATE POLICY "Admins can update teams"
ON public."Team Table"
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_user'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

-- Only admins can delete teams
CREATE POLICY "Admins can delete teams"
ON public."Team Table"
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_user'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

-- Policies for Team Members Table
-- Authenticated users can view team members
CREATE POLICY "Authenticated users can view team members"
ON public."Team Members Table"
FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage team members
CREATE POLICY "Admins can insert team members"
ON public."Team Members Table"
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_user'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

CREATE POLICY "Admins can update team members"
ON public."Team Members Table"
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_user'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

CREATE POLICY "Admins can delete team members"
ON public."Team Members Table"
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_user'::app_role) OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

-- Policies for docker_images
-- Only owners can view their docker images
CREATE POLICY "Users can view their own docker images"
ON public.docker_images
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid() OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

-- Only owners can insert docker images
CREATE POLICY "Users can insert their own docker images"
ON public.docker_images
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Only owners can update their docker images
CREATE POLICY "Users can update their own docker images"
ON public.docker_images
FOR UPDATE
TO authenticated
USING (
  owner_id = auth.uid() OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

-- Only owners can delete their docker images
CREATE POLICY "Users can delete their own docker images"
ON public.docker_images
FOR DELETE
TO authenticated
USING (
  owner_id = auth.uid() OR 
  has_role(auth.uid(), 'system_admin'::app_role)
);

-- Policies for docker_layers
-- Only users who own the parent image can view layers
CREATE POLICY "Users can view layers of their docker images"
ON public.docker_layers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.docker_images
    WHERE docker_images.id = docker_layers.image_id
    AND (docker_images.owner_id = auth.uid() OR has_role(auth.uid(), 'system_admin'::app_role))
  )
);

-- Only users who own the parent image can insert layers
CREATE POLICY "Users can insert layers for their docker images"
ON public.docker_layers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.docker_images
    WHERE docker_images.id = docker_layers.image_id
    AND docker_images.owner_id = auth.uid()
  )
);

-- Only users who own the parent image can delete layers
CREATE POLICY "Users can delete layers of their docker images"
ON public.docker_layers
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.docker_images
    WHERE docker_images.id = docker_layers.image_id
    AND (docker_images.owner_id = auth.uid() OR has_role(auth.uid(), 'system_admin'::app_role))
  )
);