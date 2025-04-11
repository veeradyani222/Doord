import Image from "next/image";
import "./ServicesItem.css";

const ServicesItem = ({ image, heading, description }) => {
  return (
    <div className="service-card">
      <div className="service-image">
        <Image src={image} alt={heading} fill style={{ objectFit: "contain" }} />
      </div>
      <h3 className="service-title">{heading}</h3>
      <p className="service-description">{description}</p>
      <button className="service-button">View More Detail</button>
    </div>
  );
};

export default ServicesItem;
