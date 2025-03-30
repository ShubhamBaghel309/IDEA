import React from "react";

function Navbar() {
  return (
    <>
      <nav className="text-black p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className=" text-2xl font-bold">AITech</h1>
          <ul className="flex space-x-4">
            <li>
              <a href="#home" className=" hover:text-gray-200">
                Home
              </a>
            </li>
            <li>
              <a href="#about" className=" hover:text-gray-200">
                About
              </a>
            </li>
            <li>
              <a href="#contact" className=" hover:text-gray-200">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
