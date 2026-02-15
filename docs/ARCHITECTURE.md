# Architecture & Security Documentation

Bienvenue dans la documentation technique de **STROKE**. Ce document détaille l'architecture du projet, le flux de données et les règles de sécurité en place. Il est destiné aux nouveaux développeurs pour comprendre rapidement le fonctionnement du système.

## 1. Vue d'ensemble

**STROKE** est une plateforme de recrutement assistée par IA permettant aux utilisateurs de gérer des projets de recrutement, d'ajouter des candidats et de collaborer au sein d'organisations.

### Stack Technique
- **Frontend** : React 18, TypeScript, Vite, TailwindCSS.
- **Backend (BaaS)** : Supabase (PostgreSQL, Auth, Storage).
- **Intégrations** : Aurinko (Synchronisation emails), OpenAI (Analyse CVs - supposé).

## 2. Structure du Projet

```bash
src/
├── components/   # Composants UI réutilisables (Boutons, Modales, Layouts)
├── context/      # Gestion d'état global (AuthContext, ThemeContext)
├── hooks/        # Hooks personnalisés (useConnections, useProjects)
├── lib/          # Configuration des clients (supabase.ts, database.types.ts)
├── pages/        # Vues principales (Connections, Dashboard, Projects)
├── utils/        # Fonctions utilitaires (emailDomains, formatters)
└── types/        # Définitions TypeScript partagées
```

## 3. Schéma de Base de Données

Le cœur de l'application repose sur PostgreSQL via Supabase. Voici les entités principales :

### Utilisateurs & Profils
- **`profiles`** : Extension de la table `auth.users`. Contient les infos publiques (nom, avatar, plan d'abonnement).
  - *Particularité* : Gestion "Dual Identity" (Email personnel vs Email professionnel) gérée dans `AuthContext`.

### Workspace & Projets
- **`projects`** : Espaces de travail pour le recrutement.
- **`project_members`** : Table de liaison pour les permissions par projet (OWNER, ADMIN, MEMBER, SCAN, ANALYZE).
- **`candidates`** : Profils recrutés, liés à un projet.

### Réseau & Organisations
- **`connections`** : Graphe social entre utilisateurs (sender_id, receiver_id, status).
- **`organisations`** : Entreprises ou groupes.
- **`organisation_members`** : Appartenance des utilisateurs aux organisations.

## 4. Sécurité & RLS (Row Level Security)

La sécurité est gérée au niveau de la base de données via les politiques RLS. Le frontend ne peut accéder qu'aux données autorisées par ces règles.

### Règles Globales
- **Authentification** : Requise pour toute opération (`authenticated` role).
- **Isolation** : Un utilisateur ne voit que ses données ou celles partagées explicitement.

### Politiques Spécifiques
1.  **Projets** :
    - Lecture : Membres du projet ou Propriétaire.
    - Écriture : Propriétaire ou Admin (selon les permissions `project_members`).
2.  **Candidats** :
    - Visibles uniquement par les membres du projet associé.
3.  **Organisations (Critique)** :
    - Pour éviter les boucles de récursion infinie (vérifier les membres nécessite de lire l'organisation qui nécessite de vérifier les membres...), nous utilisons une fonction **SECURITY DEFINER** : `get_my_org_ids()`.
    - Politique de lecture : `org_id IN (SELECT get_my_org_ids())`.

### Fonctions de Sécurité Clés
Certaines vérifications complexes sont déléguées à des fonctions PostgreSQL pour la performance et la sécurité :

- **`get_my_org_ids()`** : Retourne la liste des IDs d'organisations de l'utilisateur courant. Exécutée en tant que `postgres` (contourne RLS) pour éviter la récursion.
- **`share_organisation(u1, u2)`** : Vérifie si deux utilisateurs ont une organisation en commun. Utilisé pour autoriser/interdire certaines interactions (ex: suppression de connexion).
- **`check_is_project_member(p_id, u_id)`** : Vérifie l'appartenance à un projet.

## 5. Flux de Données

### Authentification
1.  L'utilisateur se connecte via Supabase Auth.
2.  `AuthContext` récupère la session et le profil utilisateur (`profiles`).
3.  Il détermine l'identité principale (Personnelle ou Pro) et charge les métadonnées.

### Chargement des Données
- **Hooks** (`useProjects`, `useConnections`) : Encapsulent la logique de requête.
- **Supabase Client** : Utilise le token JWT de l'utilisateur pour chaque requête.
- **Postgres** : Vérifie le JWT et applique les politiques RLS avant de retourner les données.

### Exemple : Affichage des Connexions
1.  `Connections.tsx` appelle `useConnections`.
2.  Le hook requête la table `connections` via Supabase.
3.  Postgres applique la politique : `auth.uid() = sender_id OR auth.uid() = receiver_id`.
4.  Seules les connexions pertinentes sont retournées.

## 6. Bonnes Pratiques pour le Développement

1.  **Toujours utiliser les types** : Importez depuis `src/lib/database.types.ts`.
2.  **RLS First** : Ne jamais supposer que le frontend filtre les données sensibles. La base de données doit être la source de vérité pour la sécurité.
3.  **Attention à la Récursion** : Si une politique RLS interroge la même table (directement ou indirectement), utilisez une fonction `SECURITY DEFINER` pour briser la boucle.
4.  **Édition de Profil** : Passer par les fonctions RPC ou les endpoints sécurisés si la logique métier est complexe.
