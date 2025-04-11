import Image from "next/image";
import HomeGraphics from './assets/HomeGraphics.svg';
import Search from './search/search';
import Section2 from './section2/section2';
import Services from "./Services/Services";

export default function Home() {
  return (
    <div className="home-wrapper">
      <div className="hero-content">
        <h1>Quality Home Services,<br />Delivered With Care</h1>
        <p>"Trusted Professionals Transforming Your House Into A Home."</p>
        <button className="order-btn">Order Now</button>
      </div>

      <div className="hero-graphics">
        <Image src={HomeGraphics} alt="Home graphic" />
      </div>

      <div className="search-area">
        <Search />
      </div>

      <div className="section2">
        <Section2 />
      </div>

      <div className="services">
        <Services/>
      </div>
    </div>
  );
}
