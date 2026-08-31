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
