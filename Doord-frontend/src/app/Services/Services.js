import ServicesItem from "./../ServicesItem/ServicesItem";
import "./Services.css";
import Services1 from "./../assets/Services1.svg";
import Services2 from "./../assets/Services2.svg";
import Services3 from "./../assets/Services3.svg";
import Services4 from "./../assets/Services4.svg";

const servicesData = [
  {
    image: Services1,
    heading: "Electrician",
    description: "Leak repairs, pipe installation, clogged drains",
  },
  {
    image: Services2,
    heading: "Plumber",
    description: "Leak repairs, pipe installation, clogged drains",
  },
  {
    image: Services3,
    heading: "HVAC Services",
    description: "Heating, ventilation, and air conditioning repair",
  },
  {
    image: Services4,
    heading: "Handyman Services",
    description: "General home repairs and small fixes",
  },
];

const Services = () => {
  return (
    <section className="services-section">
      <h2 className="services-heading">Services Available At Our Platform</h2>
      <div className="services-grid">
        {servicesData.map((service, index) => (
          <ServicesItem
            key={index}
            image={service.image}
            heading={service.heading}
            description={service.description}
          />
        ))}
      </div>
    </section>
  );
};

export default Services;
