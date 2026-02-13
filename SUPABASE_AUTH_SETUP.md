# Configuration de l'Authentification Google Workspace et Microsoft Entra (Azure)

Pour que les boutons de connexion fonctionnent, vous devez configurer les fournisseurs d'identité dans le tableau de bord Supabase et obtenir les clés API auprès de Google et Microsoft.

## 1. Pré-requis Supabase

1.  Allez dans votre tableau de bord Supabase : [https://supabase.com/dashboard](https://supabase.com/dashboard)
2.  Sélectionnez votre projet **STROKE**.
3.  Allez dans **Authentication** > **Providers**.
4.  Notez l'URL de callback (Redirect URL) en haut de la page. Elle ressemble à :
    `https://<votre-id-projet>.supabase.co/auth/v1/callback`

## 2. Configuration Google Workspace

1.  Allez sur la **Google Cloud Console** : [https://console.cloud.google.com/](https://console.cloud.google.com/)
2.  Créez un nouveau projet (ou sélectionnez-en un existant).
3.  Allez dans **APIs & Services** > **OAuth consent screen**.
    *   Type d'utilisateur : **Externe** (ou Interne si vous avez une organisation Google Workspace et voulez restreindre).
    *   Remplissez les informations obligatoires (Nom de l'app, emails support).
4.  Allez dans **Credentials** > **Create Credentials** > **OAuth client ID**.
    *   Application type : **Web application**.
    *   Name : `STROKE Login`.
    *   **Authorized JavaScript origins** :
        *   `http://localhost:5173` (pour le développement local)
        *   `https://votre-domaine-production.com` (votre URL Vercel/Netlify)
    *   **Authorized redirect URIs** :
        *   Collez l'URL de callback Supabase notée à l'étape 1 (`.../auth/v1/callback`).
5.  Cliquez sur **Create**.
6.  Copiez le **Client ID** et le **Client Secret**.
7.  Retournez dans Supabase > Auth > Providers > **Google**.
8.  Activez le fournisseur ("Enable Sign in with Google").
9.  Collez le **Client ID** et le **Client Secret**.
10. Cliquez sur **Save**.

## 3. Configuration Microsoft Entra (Azure)

1.  Allez sur le **Azure Portal** : [https://portal.azure.com/](https://portal.azure.com/)
2.  Recherchez et sélectionnez **Microsoft Entra ID** (anciennement Azure Active Directory).
3.  Dans le menu de gauche, cliquez sur **App registrations** > **New registration**.
    *   Name : `STROKE Login`.
    *   Supported account types : **Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant)** (recommandé pour SaaS) OU **Single tenant** (si usage interne uniquement).
    *   Redirect URI (Web) : Collez l'URL de callback Supabase (`.../auth/v1/callback`).
4.  Cliquez sur **Register**.
5.  Dans la vue d'ensemble (Overview), copiez :
    *   **Application (client) ID**
    *   **Directory (tenant) ID** (si nécessaire, souvent optionnel pour le mode Multitenant mais requis par Supabase).
6.  Dans le menu de gauche, allez dans **Certificates & secrets** > **Client secrets** > **New client secret**.
    *   Description : `Supabase Auth`.
    *   Expires : Choisissez une durée (ex: 24 mois).
    *   Cliquez sur **Add**.
    *   **IMPORTANT** : Copiez la **Value** du secret immédiatement (elle sera masquée après).
7.  Retournez dans Supabase > Auth > Providers > **Azure (Beta)**.
8.  Activez le fournisseur.
9.  Remplissez :
    *   **Application (client) ID**
    *   **Directory (tenant) ID** (Utilisez `common` pour Multitenant, ou votre ID spécifique pour Single tenant).
    *   **Client Secret** (La "Value" copiée à l'étape 6).
10. Cliquez sur **Save**.

## 4. Mise à jour de la Base de Données

Pour que les utilisateurs connectés via Google/Microsoft aient un profil créé automatiquement dans votre table `profiles`, vous devez exécuter un script SQL.

1.  Dans Supabase, allez dans **SQL Editor**.
2.  Ouvrez le fichier local `SQL\update_oauth_trigger.sql` (créé dans ce projet).
3.  Copiez son contenu.
4.  Collez-le dans l'éditeur SQL de Supabase.
5.  Cliquez sur **Run**.

## 5. Test

1.  Lancez votre projet local (`npm run dev`).
2.  Allez sur la page de Login.
3.  Cliquez sur "Continue with Google" ou "Continue with Microsoft".
4.  Vous devriez être redirigé, authentifié, et un profil devrait être créé dans votre table `profiles`.
