import React from 'react'
import { Link } from 'react-router-dom'

import Script from 'dangerous-html/react'

import Logo from './logo'
import './footer.css'

const Footer = (props) => {
    return (
        <div className="footer-container1">
            <footer className="footer-thq-thestrategistone-footer-root-elm thestrategistone-footer-root">
                <div className="thestrategistone-footer-inner">
                    <div className="thestrategistone-footer-layout">
                        <div className="thestrategistone-footer-copyright-group">
                            <div className="thestrategistone-footer-brand-mark">
                                <Link to="/homepage">
                                    <div className="thestrategistone-footer-logo-link">
                                        <Logo isOnDarkBackground={false}></Logo>
                                    </div>
                                </Link>
                            </div>
                            <div className="thestrategistone-footer-legal-copy">
                                <div className="thestrategistone-footer-icon-wrap">
                                    <svg
                                        fill="none"
                                        width="14"
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="14"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle r="10" cx="12" cy="12"></circle>
                                        <path d="M14.83 14.83a4 4 0 1 1 0-5.66"></path>
                                    </svg>
                                </div>
                                <span className="thestrategistone-footer-year">2026</span>
                                <span className="thestrategistone-footer-company">
                                    The Strategist One Telemetry. All rights reserved.
                                </span>
                            </div>
                        </div>
                        <nav aria-label="Legal navigation" className="thestrategistone-footer-nav">
                            <ul className="thestrategistone-footer-links">
                                <li className="thestrategistone-footer-link-item">
                                    <span
                                        data-planned-page="Game Asset Details"
                                        className="thestrategistone-footer-link-dummy"
                                    >
                                        Asset Registry
                                    </span>
                                </li>
                                <li className="thestrategistone-footer-link-item">
                                    <Link to="/terms-conditions">
                                        <div className="thestrategistone-footer-link">
                                            <span>Terms of Service</span>
                                        </div>
                                    </Link>
                                </li>
                                <li className="thestrategistone-footer-link-item">
                                    <Link to="/terms-conditions">
                                        <div className="thestrategistone-footer-link">
                                            <span>Privacy Policy</span>
                                        </div>
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </footer>
            <div className="footer-container2">
                <div className="footer-container3">
                    <Script
                        html={`<script defer data-name="thestrategistone-footer-interactions">
(function(){
document.addEventListener('DOMContentLoaded', () => {
  const yearSpan = document.querySelector('.thestrategistone-footer-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});
})()
</script>`}
                    ></Script>
                </div>
            </div>
        </div>
    )
}

export default Footer
