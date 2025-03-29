import React from "react";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
function Home() {
  return (
    <>
      <Navbar />

      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <label className="block text-gray-700 font-medium mb-5">
              Upload Assignment
            </label>
            <input
              type="file"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default Home;
