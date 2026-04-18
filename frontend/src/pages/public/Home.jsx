import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';

const Home = () => {
  return (
    <Layout>
      <div>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-6xl font-black mb-6 tracking-tight">
              Welcome to My Pet <span className="text-slate-400">Care+</span>
            </h1>
            <p className="text-xl mb-10 text-slate-300 max-w-2xl mx-auto font-medium">
              Your trusted partner in pet care and wellness. Start managing your pet's health with ease.
            </p>
            <div className="flex justify-center">
              <Link to="/register">
                <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200">
                  Get Started Now
                </button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Home;

