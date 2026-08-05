import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import HeroBar from "../components/Hero";
import { API_ENDPOINTS } from "../config";
import { sanitizeFields } from "../utils/sanitizer";
import { logger } from "../utils/logger";
import Modal from "../components/Modal";
import { useModal } from "../hooks/useModal";
import "../styles/Page.css";
import "../styles/Forms.css";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  rego_or_vin: "",
  lastServiced: "",
  service: "",
  carType: "",
  notes: "",
  preferredContact: "",
  returningCustomer: "",
};

export default function RequestService() {
  const [searchParams] = useSearchParams();
  const { modalState, showSuccess, closeModal } = useModal();

  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [requestData, setRequestData] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceLoadError, setServiceLoadError] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.SERVICES);
        if (!res.ok) throw new Error("Failed to load services");
        const data = await res.json();
        setServices(data);
        const preselect = searchParams.get("service");
        if (preselect && data.some((s: any) => s.name === preselect)) {
          setRequestData((prev) => ({ ...prev, service: preselect }));
        }
      } catch (err) {
        logger.error(err);
        setServiceLoadError("Unable to load services. Please refresh the page or try again later.");
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  // Handle form field changes
  const handleChange = (key: string, value: string) => {
    const next = { ...requestData, [key]: value };
    setRequestData(next);

    // Clear error for this field when user starts typing
    if (errors[key]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  // Form validation
  const validate = () => {
    const e: Record<string, string> = {};
    if (!requestData.name.trim()) e.name = "Please enter your name.";
    if (!requestData.email.trim()) e.email = "Please enter your email.";
    else {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(requestData.email)) e.email = "Please enter a valid email address.";
    }
    if (!requestData.service) e.service = "Please choose a service.";
    if (!requestData.preferredContact) e.preferredContact = "Select a preferred contact method.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate form before submission
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Prepare payload for API
      const payload = {
        name: requestData.name,
        email: requestData.email,
        phone: requestData.phone,
        rego_or_vin: requestData.rego_or_vin,
        last_serviced: requestData.lastServiced,
        service: requestData.service,
        car_type: requestData.carType,
        notes: requestData.notes,
        preferred_contact: requestData.preferredContact,
        returning_customer: requestData.returningCustomer,
      };

      // Sanitize all text inputs before sending to API
      const sanitizedPayload = sanitizeFields(payload, [
        'name',
        'email',
        'phone',
        'rego_or_vin',
        'service',
        'car_type',
        'notes',
        'preferred_contact',
        'returning_customer'
      ]);

      // Submit to backend API
      const res = await fetch(API_ENDPOINTS.REQUESTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedPayload),
      });

      if (!res.ok) {
        let msg = "Failed to submit request";
        try {
          const json = await res.json();
          if (json?.error) msg = json.error;
        } catch {}
        throw new Error(msg);
      }

      setRequestData({ ...EMPTY_FORM });
      setErrors({});
      showSuccess("Your service request has been submitted successfully! We'll review it and get back to you shortly.");
    } catch (err: any) {
      logger.error(err);
      setErrors({ form: err.message || "Error submitting request." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <HeroBar
        title="Request a Service"
        subtitle="Tell us about your vehicle and the service you require — we’ll get back to you quickly."
      />

      <div className="page-container">
        <section className="form-card">
          <h2>Vehicle & Contact Details</h2>

          <form className="form" onSubmit={handleSubmit} noValidate>
            <div aria-live="polite">
              {errors.form && <div className="error-text" role="alert">{errors.form}</div>}
            </div>

            {/* Contact Info */}
            <div className="form-subcard"> 
              <div className="form-group"> 
                <label htmlFor="name">Full Name</label> 
                <input id="name" type="text" value={requestData.name} onChange={(e) => handleChange("name", e.target.value)} className={errors.name ? "input-error" : ""} aria-describedby={errors.name ? "name-error" : undefined} required />
                {errors.name && <div id="name-error" className="error-text">{errors.name}</div>} 
              </div> 
              
              <div className="form-group"> 
                <label htmlFor="email">Email Address</label> 
                <input id="email" type="email" value={requestData.email} onChange={(e) => handleChange("email", e.target.value)} className={errors.email ? "input-error" : ""} aria-describedby={errors.email ? "email-error" : undefined} required />
                {errors.email && <div id="email-error" className="error-text">{errors.email}</div>} 
              </div> 
              
              <div className="form-group"> 
                <label htmlFor="phone">Phone</label> 
                <input id="phone" type="tel" value={requestData.phone} onChange={(e) => handleChange("phone", e.target.value)} /> 
              </div> 
            </div> 
            
            {/* Vehicle Info */}
            <div className="form-subcard">
              <div className="form-group">
                <label htmlFor="carType">Vehicle Make & Model</label>
                <input id="carType" type="text" placeholder="e.g. Toyota Camry 2019" value={requestData.carType} onChange={(e) => handleChange("carType", e.target.value)} />
              </div>

              <div className="form-group">
                <label htmlFor="rego_or_vin">Rego / VIN</label>
                <input id="rego_or_vin" type="text" value={requestData.rego_or_vin} onChange={(e) => handleChange("rego_or_vin", e.target.value)} />
              </div>

              <div className="form-group">
                <label htmlFor="lastServiced">Date Last Serviced</label>
                <input id="lastServiced" type="date" value={requestData.lastServiced} onChange={(e) => handleChange("lastServiced", e.target.value)} />
              </div>
            </div>

            {/* Service Selector */}
            <div className="form-subcard">
              {serviceLoadError && <div className="error-text">{serviceLoadError}</div>}
              <div className="form-group">
                <label htmlFor="service">Select a Service</label>
                <select
                  id="service"
                  value={requestData.service}
                  onChange={(e) => handleChange("service", e.target.value)}
                  className={errors.service ? "input-error" : ""}
                  disabled={loadingServices}
                  aria-describedby={errors.service ? "service-error" : undefined}
                >
                  <option value="">
                    {loadingServices ? "Loading services..." : "-- Choose a service --"}
                  </option>
                  {services.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.service && <div id="service-error" className="error-text">{errors.service}</div>}
              </div>

              {/* Show selected service details */}
              {requestData.service && (
                <div className="service-details">
                  {(() => {
                    const selected = services.find((s) => s.name === requestData.service);
                    if (!selected) return null;
                    return (
                      <div>
                        <p><strong>Description:</strong> {selected.description}</p>
                        {selected.base_price && (
                          <p><strong>Base Price:</strong> ${Number(selected.base_price).toFixed(2)}</p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="notes">Extra Notes</label>
                <textarea
                  id="notes"
                  value={requestData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  className={errors.notes ? "input-error" : ""}
                />
                {errors.notes && <div className="error-text">{errors.notes}</div>}
              </div>
            </div>

            {/* Preferred Contact + Returning Customer */}
            <div className="form-row centered"> 
              <div className="form-subcard"> 
                <label>Preferred Contact Method</label> 
                <div className="pill-group"> 
                  {["email", "phone"].map((method) => ( 
                    <label key={method} className="pill"> 
                    <input type="radio" name="preferredContact" value={method} checked={requestData.preferredContact === method} onChange={() => handleChange("preferredContact", method)} /> 
                  <span>{method.charAt(0).toUpperCase() + method.slice(1)}</span> 
                </label> 
                ))} 
              </div> 
              {errors.preferredContact && ( 
                <div className="error-text">{errors.preferredContact}</div> )} 
              </div> 
              
              <div className="form-subcard"> 
                <label>Returning Customer</label> 
                <div className="pill-group"> 
                  {["yes", "no"].map((option) => ( 
                  <label key={option} className="pill"> 
                    <input type="radio" name="returningCustomer" value={option} checked={requestData.returningCustomer === option} onChange={() => handleChange("returningCustomer", option)} /> 
                    <span>{option.charAt(0).toUpperCase() + option.slice(1)}</span> 
                  </label> 
                  ))} 
                </div> 
              </div> 
            </div>

            <button type="submit" className="btn form-submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting…" : "Submit Request"}
            </button>
          </form>
        </section>
      </div>

      <Modal {...modalState} onClose={closeModal} />
    </div>
  );
}
