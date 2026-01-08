-- =====================================================
-- RLS POLICIES FOR client_accounts
-- =====================================================

-- Users can view their own client account
CREATE POLICY "Users can view own client_account"
ON public.client_accounts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own client account
CREATE POLICY "Users can insert own client_account"
ON public.client_accounts
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own client account
CREATE POLICY "Users can update own client_account"
ON public.client_accounts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins can view all client accounts
CREATE POLICY "Admins can view all client_accounts"
ON public.client_accounts
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can manage all client accounts
CREATE POLICY "Admins can manage all client_accounts"
ON public.client_accounts
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- RLS POLICIES FOR projects
-- =====================================================

-- Users can view projects they own directly
CREATE POLICY "Users can view own projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  owner_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.client_accounts ca
    WHERE ca.id = projects.client_account_id
      AND ca.user_id = auth.uid()
  )
);

-- Users can update projects they own
CREATE POLICY "Users can update own projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (
  owner_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.client_accounts ca
    WHERE ca.id = projects.client_account_id
      AND ca.user_id = auth.uid()
  )
)
WITH CHECK (
  owner_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.client_accounts ca
    WHERE ca.id = projects.client_account_id
      AND ca.user_id = auth.uid()
  )
);

-- Admins can view all projects
CREATE POLICY "Admins can view all projects"
ON public.projects
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can manage all projects
CREATE POLICY "Admins can manage all projects"
ON public.projects
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- RLS POLICIES FOR prototype_comments
-- =====================================================

-- Helper function to check if user owns the project via prototype
CREATE OR REPLACE FUNCTION public.user_owns_prototype_comment(comment_prototype_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.prototypes pt
    JOIN public.projects p ON p.id = pt.project_id
    LEFT JOIN public.client_accounts ca ON ca.id = p.client_account_id
    WHERE pt.id = comment_prototype_id
      AND (p.owner_user_id = auth.uid() OR ca.user_id = auth.uid())
  )
$$;

-- Users can view comments on their projects
CREATE POLICY "Users can view own project comments"
ON public.prototype_comments
FOR SELECT
TO authenticated
USING (public.user_owns_prototype_comment(prototype_id));

-- Users can insert comments on their projects
CREATE POLICY "Users can insert own project comments"
ON public.prototype_comments
FOR INSERT
TO authenticated
WITH CHECK (public.user_owns_prototype_comment(prototype_id));

-- Users can update comments on their projects
CREATE POLICY "Users can update own project comments"
ON public.prototype_comments
FOR UPDATE
TO authenticated
USING (public.user_owns_prototype_comment(prototype_id))
WITH CHECK (public.user_owns_prototype_comment(prototype_id));

-- Admins can view all comments
CREATE POLICY "Admins can view all prototype_comments"
ON public.prototype_comments
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can manage all comments
CREATE POLICY "Admins can manage all prototype_comments"
ON public.prototype_comments
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));