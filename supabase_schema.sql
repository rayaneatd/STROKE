-- 1. EXTENSIONS (Optionnel mais recommandé)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- Table des Profils (utilisateurs)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    phone_number TEXT,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('USER', 'ADMIN')) DEFAULT 'USER',
    subscription_plan TEXT DEFAULT 'FREE',
    scans_balance INTEGER DEFAULT 0,
    purchased_scans INTEGER DEFAULT 0,
    billing_type TEXT CHECK (billing_type IN ('PREPAID', 'POSTPAID')),
    preferences JSONB DEFAULT '{}'::jsonb,
    signup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des Projets
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('ACTIVE', 'ARCHIVED', 'COMPLETED')) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb,
    investment_balance INTEGER DEFAULT 0,
    total_invested INTEGER DEFAULT 0
);

-- Table des Membres de Projet (Accès/Permissions)
CREATE TABLE public.project_members (
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('OWNER', 'ADMIN', 'EMPLOYEE')),
    permissions TEXT[] DEFAULT '{}',
    scans_used INTEGER DEFAULT 0,
    scan_quota TEXT DEFAULT 'UNLIMITED', -- Stocké en texte pour accepter 'UNLIMITED'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- Table des Candidats (Fichiers/Scans)
CREATE TABLE public.candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    size TEXT,
    status TEXT CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')) DEFAULT 'PENDING',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    score INTEGER,
    candidate_name TEXT,
    uploaded_by UUID REFERENCES public.profiles(id),
    viewed_by UUID[] DEFAULT '{}',
    exported_by UUID[] DEFAULT '{}',
    email_sent_at TIMESTAMP WITH TIME ZONE,
    email_draft TEXT
);

-- Table des Connexions (Réseau)
CREATE TABLE public.connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('CONNECTED', 'PENDING')) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ACTIVATION DE LA RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- 4. POLITIQUES RLS (POLICIES)

-- Profiles : L'utilisateur ne voit et ne modifie que lui-même
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Projects : L'owner ou un membre peut voir le projet
CREATE POLICY "Users can view joined projects" ON public.projects 
FOR SELECT USING (
    owner_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = id AND user_id = auth.uid())
);

-- Candidates : Accès si membre du projet
CREATE POLICY "Members can view project candidates" ON public.candidates
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = candidates.project_id AND user_id = auth.uid())
);

-- Connections : Sender ou Receiver peuvent voir
CREATE POLICY "Users can view own connections" ON public.connections
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 5. DONNÉES DE TEST (Basées sur tes mocks)
-- Note : Remplacer les IDs par de vrais UUIDs lors de l'insertion réelle

-- Seed de démonstration (UUIDs fictifs pour l'exemple)
-- INSERT INTO public.profiles (id, email, display_name, role, subscription_plan)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'admin@airecruit.com', 'Admin User', 'ADMIN', 'ELITE');

-- INSERT INTO public.projects (id, title, description, owner_id)
-- VALUES ('11111111-1111-1111-1111-111111111111', 'Senior Frontend Engineer', 'React, TypeScript, Node.js', '00000000-0000-0000-0000-000000000001');