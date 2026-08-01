/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import Desk from "./components/Desk";
import QuillCursor from "./components/QuillCursor";

export default function App() {
  return (
    <div className="w-full min-h-screen bg-black overflow-hidden selection:bg-amber-900/30 selection:text-amber-200">
      <Desk />
      <QuillCursor />
    </div>
  );
}
