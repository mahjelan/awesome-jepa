import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home } from "@/app/pages/Home";
import { SearchPage } from "@/app/pages/SearchPage";

const App = () => {
  return (
    <BrowserRouter
      basename={import.meta.env.BASE_URL}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
