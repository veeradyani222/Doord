import Image from "next/image";
import Hero1 from './assets/hero1.svg';
import Hero2 from './assets/hero2.svg';
import Hero3 from './assets/hero3.svg';
import Hero4 from './assets/hero4.svg';
import Hero5 from './assets/hero5.svg';
import HeroPolygonLeft from './assets/hero-polygon-left.svg';
import HeroPolygonRight from './assets/hero-polygon-right.svg';
import HeroVector from './assets/hero-bg-vector.svg';
import Search from './search/search'

export default function Home() {
  return (
    <div className="hero-container">
      <div className="hero-content">
        <h1>Quality Home Services,<br />Delivered With Care</h1>
        <p>"Trusted Professionals Transforming Your House Into A Home."</p>
        <button className="order-btn">Order Now</button>
      </div>

      <div className="hero-graphics">
        <Image src={HeroPolygonLeft} alt="Left polygon" className="polygon-left" />
        <Image src={HeroPolygonRight} alt="Right polygon" className="polygon-right" />
        <Image src={HeroVector} alt="Vector" className="vector" />
        
        <div className="tools-container">
          <Image src={Hero1} alt="Tool 1" className="hero-1" />
          <Image src={Hero2} alt="Broom" className="hero-2" />
          <div className="tools">
          <Image src={Hero3} alt="Toolbox" className="hero-3" />
        </div>
          <Image src={Hero4} alt="Tool 4" className="hero-4" />
          <Image src={Hero5} alt="Tool 5" className="hero-5" />
        </div>
      </div>
      <div className="search-area">
    <Search/>
      </div>
    </div>
  );
}
