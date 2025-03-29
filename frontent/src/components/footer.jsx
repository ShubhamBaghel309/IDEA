import React from "react";

function Footer() {
  return (
    <>
      <footer className="bg-gray-100 p-4 text-center">
        <p className="text-gray-700">
          &copy; {new Date().getFullYear()} AITech. All rights reserved.
        </p>
        <p>
          <a
            href="/privacy-policy"
            className="mr-4 text-blue-500 hover:underline"
          >
            Privacy Policy
          </a>
          <a href="/terms-of-service" className="text-blue-500 hover:underline">
            Terms of Service
          </a>
        </p>
      </footer>
    </>
  );
}

export default Footer;
