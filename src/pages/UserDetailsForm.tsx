import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, MapPin, Calendar, CreditCard, Building, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

interface Props {
  onComplete: (data: UserDetails) => void;
}

export interface UserDetails {
  dateOfBirth: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  occupation: string;
  annualIncome: string;
  panNumber: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
}

export function UserDetailsForm({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<UserDetails>({
    dateOfBirth: "",
    address: "",
    city: "",
    country: "India",
    postalCode: "",
    occupation: "",
    annualIncome: "",
    panNumber: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
  });

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else onComplete(formData);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const isStepValid = () => {
    if (step === 1) {
      return formData.dateOfBirth && formData.address && formData.city && formData.postalCode;
    }
    if (step === 2) {
      return formData.occupation && formData.annualIncome && formData.panNumber;
    }
    if (step === 3) {
      return formData.bankName && formData.accountNumber && formData.ifscCode;
    }
    return false;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-dark-900" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl"
      >
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    s < step
                      ? "bg-emerald-500 text-white"
                      : s === step
                      ? "bg-blue-600 text-white"
                      : "bg-white/5 text-gray-500"
                  }`}
                >
                  {s < step ? <CheckCircle size={20} /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                      s < step ? "bg-emerald-500" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Personal Info</span>
            <span>Financial Details</span>
            <span>Bank Account</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="glass rounded-3xl p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                    <User size={24} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white">Personal Information</h2>
                    <p className="text-sm text-gray-400">Tell us about yourself</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth</label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Street Address</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-4 top-4 text-gray-500" />
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main Street, Apartment 4B"
                      rows={3}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all resize-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Mumbai"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Postal Code</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      placeholder="400001"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition-all [&>option]:bg-gray-800 [&>option]:text-white"
                  >
                    <option value="Afghanistan" className="bg-gray-800 text-white">Afghanistan</option>
                    <option value="Albania" className="bg-gray-800 text-white">Albania</option>
                    <option value="Algeria" className="bg-gray-800 text-white">Algeria</option>
                    <option value="Argentina" className="bg-gray-800 text-white">Argentina</option>
                    <option value="Australia" className="bg-gray-800 text-white">Australia</option>
                    <option value="Austria" className="bg-gray-800 text-white">Austria</option>
                    <option value="Bangladesh" className="bg-gray-800 text-white">Bangladesh</option>
                    <option value="Belgium" className="bg-gray-800 text-white">Belgium</option>
                    <option value="Brazil" className="bg-gray-800 text-white">Brazil</option>
                    <option value="Canada" className="bg-gray-800 text-white">Canada</option>
                    <option value="China" className="bg-gray-800 text-white">China</option>
                    <option value="Denmark" className="bg-gray-800 text-white">Denmark</option>
                    <option value="Egypt" className="bg-gray-800 text-white">Egypt</option>
                    <option value="Finland" className="bg-gray-800 text-white">Finland</option>
                    <option value="France" className="bg-gray-800 text-white">France</option>
                    <option value="Germany" className="bg-gray-800 text-white">Germany</option>
                    <option value="Greece" className="bg-gray-800 text-white">Greece</option>
                    <option value="Hong Kong" className="bg-gray-800 text-white">Hong Kong</option>
                    <option value="India" className="bg-gray-800 text-white">India</option>
                    <option value="Indonesia" className="bg-gray-800 text-white">Indonesia</option>
                    <option value="Ireland" className="bg-gray-800 text-white">Ireland</option>
                    <option value="Israel" className="bg-gray-800 text-white">Israel</option>
                    <option value="Italy" className="bg-gray-800 text-white">Italy</option>
                    <option value="Japan" className="bg-gray-800 text-white">Japan</option>
                    <option value="Kenya" className="bg-gray-800 text-white">Kenya</option>
                    <option value="Malaysia" className="bg-gray-800 text-white">Malaysia</option>
                    <option value="Mexico" className="bg-gray-800 text-white">Mexico</option>
                    <option value="Netherlands" className="bg-gray-800 text-white">Netherlands</option>
                    <option value="New Zealand" className="bg-gray-800 text-white">New Zealand</option>
                    <option value="Nigeria" className="bg-gray-800 text-white">Nigeria</option>
                    <option value="Norway" className="bg-gray-800 text-white">Norway</option>
                    <option value="Pakistan" className="bg-gray-800 text-white">Pakistan</option>
                    <option value="Philippines" className="bg-gray-800 text-white">Philippines</option>
                    <option value="Poland" className="bg-gray-800 text-white">Poland</option>
                    <option value="Portugal" className="bg-gray-800 text-white">Portugal</option>
                    <option value="Qatar" className="bg-gray-800 text-white">Qatar</option>
                    <option value="Russia" className="bg-gray-800 text-white">Russia</option>
                    <option value="Saudi Arabia" className="bg-gray-800 text-white">Saudi Arabia</option>
                    <option value="Singapore" className="bg-gray-800 text-white">Singapore</option>
                    <option value="South Africa" className="bg-gray-800 text-white">South Africa</option>
                    <option value="South Korea" className="bg-gray-800 text-white">South Korea</option>
                    <option value="Spain" className="bg-gray-800 text-white">Spain</option>
                    <option value="Sri Lanka" className="bg-gray-800 text-white">Sri Lanka</option>
                    <option value="Sweden" className="bg-gray-800 text-white">Sweden</option>
                    <option value="Switzerland" className="bg-gray-800 text-white">Switzerland</option>
                    <option value="Taiwan" className="bg-gray-800 text-white">Taiwan</option>
                    <option value="Thailand" className="bg-gray-800 text-white">Thailand</option>
                    <option value="Turkey" className="bg-gray-800 text-white">Turkey</option>
                    <option value="UAE" className="bg-gray-800 text-white">United Arab Emirates</option>
                    <option value="UK" className="bg-gray-800 text-white">United Kingdom</option>
                    <option value="USA" className="bg-gray-800 text-white">United States</option>
                    <option value="Vietnam" className="bg-gray-800 text-white">Vietnam</option>
                  </select>
                </div>
              </motion.div>
            )}

            {/* Step 2: Financial Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                    <CreditCard size={24} className="text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white">Financial Details</h2>
                    <p className="text-sm text-gray-400">Help us understand your financial profile</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Occupation</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    placeholder="Software Engineer"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Annual Income</label>
                  <select
                    value={formData.annualIncome}
                    onChange={(e) => setFormData({ ...formData, annualIncome: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition-all [&>option]:bg-gray-800 [&>option]:text-white"
                    required
                  >
                    <option value="" className="bg-gray-800 text-white">Select income range</option>
                    <option value="Below ₹3 Lakhs" className="bg-gray-800 text-white">Below ₹3 Lakhs</option>
                    <option value="₹3-5 Lakhs" className="bg-gray-800 text-white">₹3 - ₹5 Lakhs</option>
                    <option value="₹5-10 Lakhs" className="bg-gray-800 text-white">₹5 - ₹10 Lakhs</option>
                    <option value="₹10-15 Lakhs" className="bg-gray-800 text-white">₹10 - ₹15 Lakhs</option>
                    <option value="₹15-20 Lakhs" className="bg-gray-800 text-white">₹15 - ₹20 Lakhs</option>
                    <option value="₹20-30 Lakhs" className="bg-gray-800 text-white">₹20 - ₹30 Lakhs</option>
                    <option value="₹30-50 Lakhs" className="bg-gray-800 text-white">₹30 - ₹50 Lakhs</option>
                    <option value="₹50 Lakhs - ₹1 Crore" className="bg-gray-800 text-white">₹50 Lakhs - ₹1 Crore</option>
                    <option value="Above ₹1 Crore" className="bg-gray-800 text-white">Above ₹1 Crore</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">PAN Number</label>
                  <input
                    type="text"
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all uppercase"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">Required for KYC verification</p>
                </div>
              </motion.div>
            )}

            {/* Step 3: Bank Account */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
                    <Building size={24} className="text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white">Bank Account</h2>
                    <p className="text-sm text-gray-400">Link your primary bank account</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bank Name</label>
                  <select
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 transition-all [&>option]:bg-gray-800 [&>option]:text-white"
                    required
                  >
                    <option value="" className="bg-gray-800 text-white">Select your bank</option>
                    <option value="HDFC Bank" className="bg-gray-800 text-white">HDFC Bank</option>
                    <option value="ICICI Bank" className="bg-gray-800 text-white">ICICI Bank</option>
                    <option value="SBI" className="bg-gray-800 text-white">State Bank of India</option>
                    <option value="Axis Bank" className="bg-gray-800 text-white">Axis Bank</option>
                    <option value="Kotak Mahindra" className="bg-gray-800 text-white">Kotak Mahindra Bank</option>
                    <option value="Other" className="bg-gray-800 text-white">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Account Number</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="1234567890123456"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="HDFC0001234"
                    maxLength={11}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all uppercase"
                    required
                  />
                </div>

                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-blue-300">
                    🔒 Your bank details are encrypted and stored securely. We use bank-level security to protect your information.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <motion.button
                onClick={handleBack}
                className="flex-1 py-3 rounded-xl glass text-gray-300 font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ArrowLeft size={18} />
                Back
              </motion.button>
            )}
            <motion.button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: isStepValid() ? 1.02 : 1 }}
              whileTap={{ scale: isStepValid() ? 0.98 : 1 }}
            >
              {step === totalSteps ? "Complete Setup" : "Continue"}
              <ArrowRight size={18} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
