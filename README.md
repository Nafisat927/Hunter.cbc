# Hunter Cookbook Club Website

The official website for the Cookbook Club at Hunter College (CUNY). It brings together three tools for a food appreciation club: a map of restaurants our members recommend, a shared recipe book, and a photo board of the food we've eaten together.

Anyone can browse the site. Logged-in e-board members can add, edit, and remove their own content.

<!-- Add a screenshot of the landing page here -->
<!-- ![Landing page](docs/landing.png) -->

## Pages

### The Cookbook Guide (`/cookbook-guide`)
An interactive map of restaurants, cafés, dessert spots, boba shops, bars, and takeout places recommended by club members.

- Search for a place with Google Places autocomplete, and the name, address, and coordinates fill in automatically
- Addresses that don't come from autocomplete are geocoded so every place lands on the map
- Filter by type, cuisine, price, and tags such as Cheap Eats, Date Night, or Group Friendly
- Each place has a detail panel with the recommender, must-try dishes, notes, photos, and a link to the address
- Built on Leaflet.js with CARTO Voyager map tiles and a responsive layout for phones

<!-- ![Cookbook Guide map](docs/map.png) -->

### The Cookbook Recipe Book (`/recipe-book`)
A two-page book layout where members share their own recipes.

- Table of contents on the left, the selected recipe on the right
- Each recipe has a title, cuisine, tags, ingredients, numbered steps, and a photo
- Filter the book by cuisine and tags (Quick, Budget, Vegan, Halal, and more)
- Recipe photos are stored in Supabase Storage, with a 5 MB limit per image
- A "Your Recipes" view shows everything you've written

<!-- ![Recipe Book](docs/recipe-book.png) -->

### The Big Back Lookback (`/big-back-lookback`)
A photo board of past club outings and meals.

- Members upload photos in bulk, stored at full quality with no compression
- Each photo can be labeled with what it is, where it's from, and a rating out of 5
- Photos show the uploader's name and profile picture
- Anyone can view or download the originals

<!-- ![Big Back Lookback](docs/lookback.png) -->

## Tech Stack

| Area | Tools |
| --- | --- |
| Frontend | React 19, React Router, Vite |
| Map | Leaflet.js, CARTO Voyager tiles, OpenStreetMap |
| Location data | Google Places API (autocomplete), Google Geocoding API |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Linting | oxlint |

## Security

The database uses PostgreSQL Row Level Security, so permissions are enforced on the server rather than only in the browser:

- Anyone visiting the site can read places, recipes, and photos
- Only logged-in members can add content, and only under their own account
- Members can edit or delete only the content they created
- Uploaded files are stored in a folder named after the uploader's user ID, and storage rules only let members change files in their own folder

## Project Structure

```
src/
  pages/
    Landing.jsx            Link hub with Instagram, WhatsApp, and the three pages
    RecipeBook.jsx         Recipe book page
    BigBackLookback.jsx    Photo board page
  cookbook-guide/
    CookbookGuidePage.jsx  Map page
    components/            Map, panels, modals, filters, login, account settings
    hooks/                 useAuth, usePlaces, useFilters
    lib/                   Supabase client, Google Maps loader, form options
  data/
    recipes.js             Recipe book data layer
    lookback.js            Photo board data layer
supabase/
  recipes.sql              Recipes table, security rules, and photo bucket
  lookback.sql             Lookback table, security rules, and photo bucket
  seed-recipes.sql         Sample recipes
```

## Getting Started

### 1. Install

```bash
git clone https://github.com/huntercookbookclub/Hunter.cbc.git
cd Hunter.cbc
npm install
```

### 2. Add your environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_KEY=
VITE_GOOGLE_MAPS_KEY=
VITE_CARTO_KEY=
```

`VITE_CARTO_KEY` is optional. Without it, the map falls back to standard OpenStreetMap tiles.

### 3. Set up the database

In your Supabase project, open the SQL Editor and run the files in `supabase/`. Each one is safe to run more than once.

### 4. Run it

```bash
npm run dev      # start the dev server
npm run build    # build for production
npm run lint     # check the code
```

## Contributors

- [Brandon Chan Fennimore](https://github.com/brandonchanfennimore)
- [Nafisat](https://github.com/Nafisat927)

## Links

- Instagram: [@hunter.cbc](https://www.instagram.com/hunter.cbc/)
