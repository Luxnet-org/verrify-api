# **Verrify Product Requirement Document (PRD)**

# 

# **1\. Executive Summary**

Verrify is evolving from a single-sided listing platform for real estate companies into a dual-sided **Property Verification & Management Ecosystem**.

* **For Companies:** A platform to list, map, and validate their land banks to build trust with buyers.  
* **For Individual Users:** A service to request independent verification of properties they intend to buy and a digital portfolio to manage their land assets.

This PRD outlines the requirements for the "User-Centric" features: Paid Verification Requests (3-Stage Process) and Digital Portfolio Management.

## **2\. User Personas**

### **A. The Individual User (Buyer/Owner)**

* **Goal:** Wants to verify a property before payment or digitize their existing land documents.  
* **Needs:** Transparency on verification progress, easy access to their land map, and a secure way to store documents.

### **B. The Real Estate Company (Lister)**

* **Goal:** Wants to prove ownership of their estate to attract buyers.  
* **Needs:** A way to chart land coordinates, upload bulk documents (C of O, Survey), and receive an official "Verified" badge.

### **C. The Verrify Admin (Operator)**

* **Goal:** Manages the verification pipeline.  
* **Needs:** Tools to move cases between stages (Digital \-\> Physical \-\> Legal) and issue reports.

## **3\. Functional Requirements: User Workflows**

### **A. Verification Request Service (The "3-Stage" Flow)**

* **Trigger:** User selects "Verify Property" from the dashboard.  
* **Inputs:**  
  1. Property details (Location, Seller Name and other needed information).  
  2. Rough coordinates (User sketches/charts area on the map).  
  3. Document Uploads (Survey Plan, Receipts).  
* **Process:**  
  1. **Submission:** User submits data.  
  2. **Payment:** System generates a payment gateway request (Paystack/Flutterwave).  
  3. **Case Generation:** Upon payment success, a unique **Case ID** (e.g., VR-2024-001) is generated.  
* **Output:** User sees the case in their "Tracker".

### **B. Verification Case Management (State Machine)**

The system must enforce a strict progression of stages for every Verification Case.

| Stage | Description | System Action |
| :---- | :---- | :---- |
| **Initiated** | User has drafted a request but not paid. | Draft saved. |
| **Payment Pending** | User clicked "Pay". | Awaiting gateway webhook. |
| **Stage 1: Preliminary** | Payment received. Admin checks digital records. | Notification sent to Admin. |
| **Stage 2: Field Visit** | Admin confirms digital data matches. Field agents deployed. | Status updated on User Dashboard. |
| **Stage 3: Final Report** | Legal/Gov verification complete. | Final Report generated. |
| **Completed** | Process finished. | "Verified" certificate issued (optional). |
| **Rejected** | Property failed verification. | Rejection Report sent to User email. |

### 

### **C. Portfolio Management ("My Land")**

* **Goal:** Users should be able to "claim" or "save" land they have bought from verified Companies.  
* **Mechanism:**  
  1. User selects "Add to Portfolio".  
  2. User inputs **Company Name** and **Land Identification Number (LIN)** provided by the seller.  
  3. System validates the LIN against the Company’s verified assets.  
  4. If valid, the property polygon appears in the User's "My Portfolio" map view.

## **4\. Functional Requirements: Company Workflows (Refinement)**

### **A. Property Listing & Submission**

* **Enhancement:** The "Create Property" flow must enforce a strict **Document Checklist**. A company cannot submit a listing for verification until mandatory documents (Survey Plan, C of O) are uploaded.  
* **Geospatial Logic:** The system must reject any new submission that geographically overlaps with an existing "Verified" or "Pending" property to prevent double-allocation.  
* **Land Identification Number (LIN) Generation:**  
  * Upon successful verification (Status changes to VERIFIED), the system must automatically generate a unique **LIN** for the property (and sub-properties).  
  * **Format:** Human-readable string, e.g., LIN-{STATE}-{YEAR}-{RANDOM\_DIGITS} (e.g., LIN-LA-24-8832).  
  * This LIN is displayed on the Company Dashboard so they can share it with buyers.

### **B. Status Feedback**

* **Requirement:** If an Admin rejects a Company's property, the system must allow the Admin to select specific reasons (e.g., "Invalid Survey Plan", "Coordinates Mismatch") which are included in the rejection email.

## **5\. Data & Information Architecture**

### **A. Case Records (VerificationRequest)**

The system must store a distinct record for every verification attempt. This is separate from the "Property" listing itself.

* **Attributes:** Case ID, Requester User, Current Stage, Payment Reference, Admin Notes, Final Report URL.

### **B. Portfolio Records (PortfolioItem)**

* **Attributes:** Owner (User), Property Link, Allocation ID (LIN), Date Added.

### **C. Payment Records**

* **Attributes:** Transaction Ref, Amount, Gateway Response, Linked Case ID.

### **D. System Cleanup**

* **Refactor Note:** The existing "Verification" data object (currently used for OTPs/Password Reset) must be renamed to **"AuthToken"** to prevent confusion with the new Property Verification features.

## **6\. System Notifications**

The system must trigger automated emails at key lifecycle events:

1. **Payment Success:** Receipt sent to User.  
2. **Stage Progression:** "Your verification has moved to Stage 2."  
3. **Action Required:** "Please upload clearer documents."  
4. **Final Verdict:** "Here is your Verification Report" (PDF attachment or Link).  
5. **Rejection:** "Your property verification failed for the following reasons..."

## **7\. Admin Backoffice Requirements**

Admins require a dedicated interface to:

1. View a queue of "Pending Verification Cases."  
2. View the User's charted polygon overlaid on the Master Map.  
3. Move a case to the next stage (Stage 1 \-\> 2 \-\> 3).  
4. Upload the "Final Report" file to close a case.  
5. Reject a case with a specific reason.

## **8\. Implementation Roadmap & Flow Analysis**

This section details the gap between the current codebase and the requirements.

### **A. Already Implemented Flows (To Be Preserved & Refined)**

| Feature | Codebase Status | Description | Action Required |
| :---- | :---- | :---- | :---- |
| **Auth & User Mgmt** | ✅ Implemented | AuthService, UserService. Handles Signup, Login, Password Reset, Roles. | **Refactor**: Rename Verification entity to AuthToken to avoid naming collisions. |
| **Company Profile** | ✅ Implemented | CompanyService. Handles Company creation and verification status. | No major changes. |
| **Property Creation** | ✅ Implemented | PropertyService.create. Handles polygon mapping, turf.js validation, and doc upload. | **Enhance**: Add logic to generate LIN upon verification. |
| **Sub-Property Logic** | ✅ Implemented | createSubProperty. Checks containment within parent polygon. | **Enhance**: Ensure LINs are generated for sub-properties too. |
| **Geospatial Search** | ✅ Implemented | PropertyService. Viewport and Radius search using PostGIS. | **Maintain**: Crucial for map features. |

### 

### **B. New Flows (To Be Implemented)**

| Feature | Description | Implementation Details |
| :---- | :---- | :---- |
| **1\. User Verification Request** | User initiates a request to verify a specific property. | **New Entity**: VerificationCase. **Service**: VerificationCaseService. **Endpoints**: POST /verify-request, GET /verify-request/my-cases. |
| **2\. Payment Integration** | User pays for the verification service. | **New Entity**: PaymentTransaction. **Service**: Payment Provider Integration (Paystack/Flutterwave). **Logic**: Webhook handler to trigger VerificationCase creation. |
| **3\. LIN Generation** | Unique ID for Verified Properties. | **Logic**: In PropertyService.updatePropertyStatus, if status \-\> VERIFIED, generate string LIN-XX-XX-XXXX and save to Property entity. |
| **4\. Portfolio Management** | User adds property using LIN. | **New Entity**: PortfolioItem. **Service**: PortfolioService. **Endpoint**: POST /portfolio/claim (takes LIN, verifies User). |
| **5\. 3-Stage Workflow** | Admin moves case through stages. | **Logic**: Add stage field to VerificationCase. **Endpoint**: PATCH /admin/case/:id/stage. **Email**: Trigger specific email templates on stage change. |
| **6\. Admin Rejection Reasons** | Detailed rejection feedback. | **Logic**: Update updatePropertyStatus to accept an array of rejection codes/messages, not just a string. |

