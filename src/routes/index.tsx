import { Button } from "@mui/material";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAppTheme } from "../shared/hooks";

export const AppRoutes = () => {
  const {toggleTheme} = useAppTheme();

  return (
    <Routes>
      <Route path="/pagina-inicial" element={<Button variant="contained" color="primary" onClick={toggleTheme}>Página inicial</Button>}></Route>
      <Route path="*" element={<Navigate to="/pagina-inicial" />}></Route>
    </Routes>
  );
};
