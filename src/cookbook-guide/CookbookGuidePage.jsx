import { useState } from 'react';
import { usePlaces } from './hooks/usePlaces';
import { useFilters } from './hooks/useFilters';
import { useAuth } from './hooks/useAuth';
import MapView from './components/MapView';
import PlaceDetailPanel from './components/PlaceDetailPanel';
import TopBar from './components/TopBar';
import FilterPanel from './components/FilterPanel';
import EboardControls from './components/EboardControls';
import LoginModal from './components/LoginModal';
import AddPlaceModal from './components/AddPlaceModal';
import AccountSettingsModal from './components/AccountSettingsModal';
import MyRecommendationsModal from './components/MyRecommendationsModal';
import './fonts.css';
import './cookbook-guide.css';

export default function CookbookGuidePage() {
  const { places, loading, error, reload } = usePlaces();
  const filters = useFilters(places);
  const { currentUser, login, logout } = useAuth();
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [addPlaceOpen, setAddPlaceOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [myRecsOpen, setMyRecsOpen] = useState(false);

  return (
    <div className="cookbook-guide-app">
      <TopBar
        filters={filters}
        filterPanelOpen={filterPanelOpen}
        onToggleFilterPanel={() => setFilterPanelOpen((o) => !o)}
      />

      <div className="main">
        {loading && <div className="status-banner">Loading places…</div>}
        {error && <div className="status-banner status-error">Error: {error}</div>}

        <FilterPanel
          open={filterPanelOpen}
          onClose={() => setFilterPanelOpen(false)}
          filters={filters}
          places={places}
        />

        <MapView places={filters.filteredPlaces} onSelectPlace={setSelectedPlace} />

        <PlaceDetailPanel place={selectedPlace} onClose={() => setSelectedPlace(null)} />
      </div>

      <EboardControls
        currentUser={currentUser}
        onOpenLogin={() => setLoginOpen(true)}
        onOpenAccountSettings={() => setAccountSettingsOpen(true)}
        onOpenMyRecs={() => setMyRecsOpen(true)}
        onLogout={logout}
        onOpenAddPlace={() => {
          setEditingPlace(null);
          setAddPlaceOpen(true);
        }}
      />

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={login} />

      <AddPlaceModal
        open={addPlaceOpen}
        onClose={() => setAddPlaceOpen(false)}
        currentUser={currentUser}
        editingPlace={editingPlace}
        onSaved={reload}
      />

      <AccountSettingsModal
        open={accountSettingsOpen}
        onClose={() => setAccountSettingsOpen(false)}
        currentUser={currentUser}
      />

      <MyRecommendationsModal
        open={myRecsOpen}
        onClose={() => setMyRecsOpen(false)}
        currentUser={currentUser}
        places={places}
        onEdit={(place) => {
          setEditingPlace(place);
          setAddPlaceOpen(true);
        }}
        onDeleted={reload}
      />
    </div>
  );
}
