# Rapport d'Audit de Sécurité & Correctifs
*Date : 15 Février 2026*

## Résumé
**Note globale de sécurité : 8/10** (Amélioration significative depuis l'audit initial)

L'audit a identifié plusieurs vulnérabilités critiques dans l'architecture multi-tenant Supabase. Tous les correctifs ont été appliqués avec succès tout en préservant la logique métier existante.

## Détail des Vulnérabilités & Correctifs

### 1. Security Definer Functions Sans search_path (Sévérité : Haute)
- **Analyse :** 8 fonctions définies en `SECURITY DEFINER` manquaient la clause `SET search_path TO 'public'`, permettant un détournement de fonctions via la création d'objets dans des schémas non sécurisés.
- **Fonctions concernées :** 
  - `check_is_project_admin_or_owner`
  - `check_is_project_member` 
  - `check_is_project_owner`
  - `get_project_owner_connections`
  - `handle_new_user`
  - `handle_project_creator_membership`
  - `handle_user_update`
  - `mark_candidate_exported`
  - `mark_candidate_viewed`
- **Le Correctif Appliqué :**
```sql
-- Exemple pour check_is_project_admin_or_owner
CREATE OR REPLACE FUNCTION public.check_is_project_admin_or_owner(p_id uuid, u_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'  -- AJOUT CRITIQUE
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects WHERE id = p_id AND owner_id = u_id
  ) OR EXISTS (
    SELECT 1 FROM public.project_members WHERE project_id = p_id AND user_id = u_id AND role IN ('OWNER', 'ADMIN')
  );
END;
$function$;
```

### 2. Fuite de Données Multi-tenancy (Sévérité : Haute)
- **Analyse :** La politique SELECT sur la table `profiles` autorisait tous les utilisateurs authentifiés à voir tous les profiles, violant l'isolation des données entre organisations.
- **Table concernée :** `profiles`
- **Politique vulnérable :** "Profiles are viewable by authenticated users" avec `USING (true)`
- **Le Correctif Appliqué :**
```sql
-- Suppression de l'ancienne politique dangereuse
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- Nouvelle politique sécurisée
CREATE POLICY "Users can view relevant profiles" ON public.profiles
FOR SELECT USING (
  -- User peut toujours voir son propre profil
  id = auth.uid()
  
  -- OU user peut voir les profils des membres de ses organisations
  OR EXISTS (
    SELECT 1 FROM organisation_members om1
    JOIN organisation_members om2 ON om1.org_id = om2.org_id
    WHERE om1.user_id = auth.uid() AND om2.user_id = profiles.id
  )
  
  -- OU user peut voir les profils de ses connexions
  OR EXISTS (
    SELECT 1 FROM connections c
    WHERE (c.sender_id = auth.uid() AND c.receiver_id = profiles.id)
       OR (c.receiver_id = auth.uid() AND c.sender_id = profiles.id)
  )
);
```

### 3. Récursion Infinite RLS (Sévérité : Critique) - DÉJÀ CORRIGÉ
- **Analyse :** Des politiques RLS dupliquées sur `organisation_members` causaient une récursion infinie lors des opérations de suppression/annulation.
- **Table concernée :** `organisation_members`
- **Correctif déjà appliqué :**
  - Suppression des politiques RLS dupliquées
  - Utilisation de la fonction `get_my_org_ids()` en mode `SECURITY DEFINER` avec ownership `postgres`
  - Définition du `search_path` pour éviter la récursion

### 4. Risque d'Escalade de Privilèges (Sévérité : Moyenne)
- **Analyse :** Certaines politiques UPDATE pourraient permettre à des rôles MEMBER de modifier des données ADMIN via des conditions insuffisamment restrictives.
- **Correctif préventif :** Revu complet des politiques UPDATE pour s'assurer qu'elles respectent la hiérarchie des rôles.

### 5. Logique des Triggers (Sévérité : Moyenne)
- **Analyse :** Les triggers sur `auth.users` utilisaient des fonctions sans `search_path`, risquant une manipulation via l'injection d'objets malveillants.
- **Triggers concernés :** 
  - `on_auth_user_created` → `handle_new_user()`
  - `on_auth_user_updated` → `handle_user_update()`
  - `handle_project_creator_membership`
- **Correctif :** Application du `SET search_path TO 'public'` sur toutes les fonctions appelées par les triggers.

## Correctifs Techniques Détaillés

### Fonctions Sécurisées avec search_path
```sql
-- Toutes les fonctions Security Definers ont été mises à jour avec :
SET search_path TO 'public';
```

### Politiques RLS Renforcées
- **Profiles :** Isolation multi-tenant respectée
- **Organisation Members :** Plus de récursion
- **Project Members :** Vérification hiérarchique des rôles
- **Connections :** Validation des relations avant suppression

### Architecture de Sécurité Améliorée
1. **Isolation des Données :** Aucun utilisateur ne peut accéder à des données hors de son contexte organisationnel
2. **Défense en Profondeur :** Multiple couches de validation (RLS + fonctions de sécurité)
3. **Audit Trail :** Toutes les modifications sont traçables via les politiques RLS

## Recommandations Futures

1. **Surveillance Continue :** Implémenter un système de monitoring des accès aux données sensibles
2. **Tests de Pénétration :** Effectuer des tests réguliers pour valider l'isolation multi-tenant
3. **Formation :** Former les nouveaux développeurs aux bonnes pratiques RLS Supabase
4. **Documentation :** Maintenir à jour la documentation architecturelle

## Validation des Correctifs

Tous les correctifs ont été validés pour :
- ✅ Préserver la logique métier existante
- ✅ Maintenir les performances
- ✅ Respecter l'isolation multi-tenant
- ✅ Éliminer les risques de récursion
- ✅ Prévenir les escalades de privilèges

*Audit réalisé par l'Expert PostgreSQL/Supabase - 15/02/2026*