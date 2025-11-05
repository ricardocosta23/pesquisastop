import logoImage from "@assets/img_logo_1762367747211.png";

export function Navbar() {
  return (
    <nav className="bg-[#0f172a] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-24">
          <div className="flex items-center">
            <img 
              src={logoImage} 
              alt="TopService Logo" 
              className="h-16"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
