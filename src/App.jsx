import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);

function App() {
  const [boards, setBoards] = useState([]);

  useEffect(() => {
    getBoards();
  }, []);

  async function getBoards() {
    const { data } = await supabase.from("games").select();
    setBoards(data);
  }

  return (
    <>
      <h1>Qat Cafe</h1>
      <ul>
        {boards.map((board) => (
          <li key={board.id}>{board.id}</li>
        ))}
      </ul>
    </>
  );
}

export default App;
