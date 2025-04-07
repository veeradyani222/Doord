import Image from "next/image";
import HomeGraphics from './assets/HomeGraphics.svg';
import Search from './search/search'

export default function Home() {
  return (
<div >
    <div className="hero-content">
    <h1>Quality Home Services,<br />Delivered With Care</h1>
    <p>"Trusted Professionals Transforming Your House Into A Home."</p>
    <button className="order-btn">Order Now</button>
  </div>

    <div className="hero-container">
      <div className="hero-graphics">
        <Image src={HomeGraphics} alt="Left polygon" className="polygon-left" />
      </div>
      <div className="search-area">
    <Search/>
      </div>
    </div>
    </div>
  );
}
