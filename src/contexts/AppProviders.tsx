import type { PropsWithChildren } from "react";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider } from "./AuthContext";
import { Provider as ReduxProvider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "../redux/store";
import GlobalTopLoader from "../components/common/GlobalTopLoader";
import { ToastContainer } from "react-toastify";

export default function AppProviders({ children }: PropsWithChildren) {
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <HelmetProvider>
          <ThemeProvider>
            <BrowserRouter>
              <AuthProvider>
                <GlobalTopLoader />
                {children}
                <ToastContainer
                  autoClose={750}
                  closeOnClick={false}
                  draggable
                  hideProgressBar={false}
                  limit={500}
                  newestOnTop={false}
                  pauseOnFocusLoss
                  pauseOnHover={false}
                  position="bottom-right"
                  rtl={false}
                  theme="dark"
                />
              </AuthProvider>
            </BrowserRouter>
          </ThemeProvider>
        </HelmetProvider>
      </PersistGate>
    </ReduxProvider>
  );
}
