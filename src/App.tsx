import { StoreProvider, store } from './Stores/RootStore';
import { spy } from 'mobx';

import Map from './Map';
import Gui from './Gui';
import DataLoader from './DataLoader';

import './App.css';

if (import.meta.env.DEV) {
  spy(event => {
    if (event.type === "action") {
      console.debug("[mobx event]", event.name, ...event.arguments);
    }
  })
}

function App() {
  return (
    <StoreProvider value={store}>
      <Map />
      <Gui />
      <DataLoader />
    </StoreProvider>
  )
}

export default App;
