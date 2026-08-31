# Togevo — Together + Evolution

PWA de suivi d'objectifs entraîneur/joueur, conforme au cahier des charges v1.

## Ce qui est livré (v1 en mode démo)

- **Auth** : écrans connexion/inscription, choix de rôle(s) (joueur / entraîneur / les deux)
- **Vue joueur** : stats (points AFTT, objectifs en cours/atteints), liste d'objectifs avec cycle d'état (à faire → en cours → atteint), suggestions par catégorie si pas d'entraîneur, graphique de progression, archives
- **Vue entraîneur** : navigation groupes → joueurs → objectifs, création/gestion de groupes avec lien WhatsApp, ajout de joueurs (nouveaux ou existants), assignation d'objectifs individuels ou à tout un groupe, retrait d'un joueur (avec archivage + notification)
- **Objectifs** : types (technique / résultat match / points AFTT), catégories (technique/physique/mental/tactique), échéances ou date précise, commentaire obligatoire pour toute modif/suppression par un coach, validation à l'honneur par joueur ou coach
- **Notifications** in-app pour tous les événements du cahier des charges (+ trophées débloqués, défis blagues)
- **Boutons WhatsApp** (wa.me) sur les profils joueur/coach et les groupes
- **Gamification** :
  - Vitrine de trophées (8 badges démo : régularité, technique, mental, esprit d'équipe, progression AFTT…), avec option de confidentialité (publique / privée — visible alors seulement par le joueur et son entraîneur)
  - Double mode d'affichage : **Focus** (sobre, adultes) et **Gamifié** (Togecoins, boutique, défis — jeunes), au choix dans le profil
  - Monnaie virtuelle **Togecoins** (symbolisée par un jeton "T") : gagnés en atteignant des objectifs et en débloquant des trophées, dépensables en boutique (thèmes, cadres d'avatar cosmétiques) ou pour envoyer un défi blague (5 Togecoins)
  - Réinitialisation saisonnière des Togecoins (bouton de démo dans Profil → « Admin club ») pour éviter l'inflation
  - Système d'amis : rapprochement automatique par groupe d'entraînement (immédiat) + ajout manuel par recherche (pseudo/nom, simule le QR code) **soumis à l'acceptation du destinataire**, avec une liste de demandes reçues à accepter/refuser
  - Défis blagues entre ami·es, payants en Togecoins (modèles prêts à l'emploi ou message libre) — bloqués si solde insuffisant
  - Identité double : pseudo affiché entre joueurs, nom réel toujours visible par l'entraîneur pour la gestion administrative
- **PWA installable** : manifest, service worker (cache offline basique), icônes
- **Schéma Supabase complet** (`supabase/schema.sql`) avec Row Level Security, prêt à l'emploi

## Lancer en local (mode démo, sans backend)

Ouvre simplement `index.html` dans un navigateur, ou sers le dossier :

```bash
npx serve .
# ou
python3 -m http.server 8080
```

L'app démarre directement connectée sur un compte de démonstration (Camille,
joueuse **et** entraîneuse) avec des données d'exemple générées en local
(`localStorage`). Tu peux basculer entre "Mon entraînement" et "Mes joueurs"
en haut de l'écran pour voir les deux points de vue.

## État actuel du backend (important)

**L'authentification est maintenant réelle**, branchée sur ton projet Supabase :
créer un compte, se connecter, se déconnecter passent par de vrais comptes
Supabase Auth (avec confirmation par e-mail si activée sur ton projet).

**Le reste des données (groupes, objectifs, trophées, amis, Togecoins...)
fonctionne encore en local (`localStorage`)**, par choix : migrer tout d'un
coup était trop risqué à tester à distance. Un compte fraîchement créé démarre
donc "vide" (pas d'objectif, pas de groupe) — c'est normal et attendu, ce
sera comblé au fur et à mesure que chaque partie sera migrée vers de vraies
tables Supabase.

Concrètement, `js/store.js` mélange donc deux mondes :
- Les fonctions `supabaseSignUp` / `supabaseSignIn` / `supabaseSignOut` /
  `watchSupabaseAuth` parlent à Supabase Auth pour de vrai.
- `ensureLocalProfile` crée un profil local (dans le navigateur) indexé sur
  le vrai identifiant Supabase de l'utilisateur — ce qui permettra, à chaque
  prochaine étape de migration, de brancher une table Supabase de plus sans
  jamais changer les identifiants déjà utilisés partout dans le code.
- Toutes les autres fonctions (`getGroups`, `addGoal`, `getFriends`, etc.)
  continuent d'utiliser `localStorage` comme avant.

### Prochaines étapes de migration (dans l'ordre conseillé)

1. Table `profiles` (nom, pseudo, mode, vie privée, Togecoins) → remplace `ensureLocalProfile`/`saveProfile`
2. `coach_player_links` + invitations de joueurs par un coach
3. `groups` / `group_members`
4. `goals` (le cœur de l'appli)
5. `notifications`
6. Amis, défis blagues, boutique/trophées (moins prioritaire, peut rester local plus longtemps)

## Passer en production avec Supabase

1. Crée un projet sur [supabase.com](https://supabase.com), région **Frankfurt** (RGPD).
2. Dans l'éditeur SQL du projet, exécute `supabase/schema.sql`.
3. Dans `js/config.js` :
   - passe `DEMO_MODE` à `false`
   - renseigne `SUPABASE_URL` et `SUPABASE_ANON_KEY` (Project Settings → API)
4. Remplace le contenu des fonctions de `js/store.js` par les appels
   `togevoSupabase.from('...')` correspondants — les noms de fonctions et la
   forme des objets retournés ont été choisis pour matcher directement les
   tables du schéma, donc chaque fonction se réécrit indépendamment.
5. Déploie sur GitHub Pages (le dossier est déjà organisé pour ça — pas de
   build step nécessaire) puis pointe `togevo.be`.

## Prochaines étapes suggérées

- Brancher Supabase Auth (email/mot de passe) à la place du login démo
- Recherche d'entraîneur par nom/club (bouton déjà en place, non branché)
- Vraie recherche de joueurs existants à ajouter à un groupe
- Traduire les textes vers l'anglais (les libellés sont déjà centralisés dans `app.js`)

Contact projet : nicoping2010@gmail.com
