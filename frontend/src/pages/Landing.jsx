import { Link } from "react-router-dom";
import {
  FileText,
  CreditCard,
  Store,
  MapPin,
  Bell,
  BarChart3,
  ShieldCheck,
  Bike,
  ArrowRight,
} from "lucide-react";

import Footer from "../components/Footer";
import boxerImg from "../assets/boxer125.png";


export default function Landing() {

  return (
    <div className="landing">


      {/* NAVBAR */}
      <nav className="landing-nav">

        <div className="landing-brand">
          <Bike size={22}/>
          PIKIPIKI CONTRACT AND SALES
        </div>


        <div className="landing-nav-links">

          <a href="#features" className="nav-link">
            Features
          </a>

          <a href="#contact" className="nav-link">
            Contact
          </a>


          <Link 
            to="/login" 
            className="nav-link"
          >
            Login
          </Link>


          <Link 
            to="/register" 
            className="btn-nav"
          >
            Get Started
          </Link>


        </div>

      </nav>



      {/* HERO */}

      <section className="hero">


        <div className="hero-content">


          <span className="hero-badge">

            <ShieldCheck size={15}/>

            Trusted Motorcycle Platform

          </span>



          <h1>
            Rent, Contract & Buy Motorcycles — All in One Place
          </h1>



          <p>

            Browse available motorcycles for contract,
            manage payments online, and buy or sell bikes
            safely through our marketplace.

          </p>



          <div className="hero-actions">


            <Link
              to="/register"
              className="btn-primary hero-btn"
            >

              Create Free Account

              <ArrowRight size={17}/>

            </Link>



            <Link
              to="/login"
              className="btn-outline hero-btn"
            >

              I Already Have an Account

            </Link>


          </div>




          <div className="hero-stats">


            <div className="hero-stat">

              <strong>
                500+
              </strong>

              <span>
                Motorcycles Listed
              </span>

            </div>



            <div className="hero-stat">

              <strong>
                1200+
              </strong>

              <span>
                Happy Customers
              </span>

            </div>



            <div className="hero-stat">

              <strong>
                24/7
              </strong>

              <span>
                Support
              </span>

            </div>



          </div>


        </div>





        {/* BOXER IMAGE */}

        <div className="hero-illustration">


          <img

            src={boxerImg}

            alt="Bajaj Boxer 125"

            className="hero-illustration-img"

          />


        </div>



      </section>






      {/* FEATURES */}

      <section 
        className="features" 
        id="features"
      >


        <span className="section-label">
          Why MotoContract
        </span>



        <h2>
          Everything You Need, Built In
        </h2>



        <p className="section-sub">

          One platform for contracts,
          payments and motorcycle marketplace.

        </p>




        <div className="features-grid">


          <Feature 
            icon={<FileText/>}
            title="Digital Contracts"
            text="Create motorcycle contracts digitally."
          />


          <Feature 
            icon={<CreditCard/>}
            title="Secure Payments"
            text="Track payments and receipts easily."
          />


          <Feature 
            icon={<Store/>}
            title="Marketplace"
            text="Buy and sell motorcycles safely."
          />


          <Feature 
            icon={<MapPin/>}
            title="Location Aware"
            text="Find motorcycles near you."
          />


          <Feature 
            icon={<Bell/>}
            title="Notifications"
            text="Receive instant updates."
          />


          <Feature 
            icon={<BarChart3/>}
            title="Transparency"
            text="Monitor contracts and balances."
          />


        </div>


      </section>







      {/* CTA */}

      <section 
        className="cta"
        id="contact"
      >

        <h2>
          Ready to get started?
        </h2>


        <p>
          Join today and manage your motorcycle contracts easily.
        </p>


        <Link
          to="/register"
          className="btn-primary hero-btn"
        >

          Create Your Account

          <ArrowRight size={16}/>

        </Link>


      </section>




      <Footer/>


    </div>
  );
}





function Feature({icon,title,text}){

  return (

    <div className="feature-card">

      <div className="feature-icon">

        {icon}

      </div>


      <h3>
        {title}
      </h3>


      <p>
        {text}
      </p>


    </div>

  )

}