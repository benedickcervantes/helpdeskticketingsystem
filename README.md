# FCDC Helpdesk Enterprise IT Support

A comprehensive FCDC Helpdesk Enterprise IT Support built with Next.js 14, Tailwind CSS, and Firebase. This system provides separate dashboards for users, admins, and top management with role-based access control.

## 🚀 Features

### User Dashboard (Support Hub)
- **Dashboard Overview**: Personal ticket statistics and system overview
- **Create Tickets**: Submit new support requests with priority and category
- **All Tickets**: View all tickets from all users for transparency
- **Profile Management**: Update user information and department

### Admin Dashboard
- **Admin Overview**: System-wide statistics and metrics
- **Ticket Management**: View, assign, and manage all tickets
- **User Management**: CRUD operations for user accounts
- **Categories Management**: Manage ticket categories

### Executive Dashboard (Top Management)
- **Executive Summary**: High-level business insights
- **Analytics Overview**: Comprehensive charts and visualizations
- **Performance Metrics**: SLA compliance and KPIs
- **Department Analysis**: Department-wise performance breakdown
- **Trend Analysis**: Historical trends and predictive insights
- **Report Generation**: Downloadable PDF and PowerPoint reports

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Charts**: Custom HTML5 Canvas charts
- **Reports**: jsPDF, html2canvas, pptxgenjs
- **Styling**: Professional Green & Gray color palette

## 📊 Key Features

### Authentication & Authorization
- Firebase Authentication with email/password
- Role-based access control (admin, user, management)
- Secure route protection
- User profile management with department tracking

### Real-time Data
- Live ticket updates using Firestore listeners
- Real-time user management
- Automatic data synchronization
- Optimistic UI updates

### Professional Design
- Modern, responsive design
- Professional Green & Gray color scheme
- Glass-morphism effects
- Mobile-first responsive layout
- Executive-ready dashboards

### Advanced Reporting
- Multiple report types (Executive, Analytics, Performance, etc.)
- PDF and PowerPoint generation
- Custom chart generation
- Professional document formatting
- Downloadable reports

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Firebase project with Firestore and Authentication enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd helpdeskticketingsystem
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a Firebase project
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Update `src/app/firebaseconfig.js` with your Firebase config

4. **Set up Firestore Security Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/
│   ├── admin/           # Admin dashboard page
│   ├── auth/            # Authentication page
│   ├── management/      # Executive dashboard page
│   ├── user/            # User dashboard page
│   ├── components/      # React components
│   │   ├── AdminDashboard.jsx
│   │   ├── UserDashboard.jsx
│   │   ├── ManagementDashboard.jsx
│   │   ├── AuthForm.jsx
│   │   ├── TicketForm.jsx
│   │   ├── TicketList.jsx
│   │   ├── ReportGenerator.jsx
│   │   └── ...
│   ├── contexts/        # React contexts
│   │   └── AuthContext.js
│   ├── lib/             # Utility functions
│   ├── firebaseconfig.js
│   ├── layout.js
│   └── page.js
```

## 🔐 User Roles

### User
- Create and view tickets
- Update profile information
- View all tickets for transparency

### Admin
- Full ticket management
- User management (CRUD operations)
- System administration
- Access to executive dashboard

### Management
- Executive dashboard access
- Advanced analytics and reporting
- Downloadable reports
- Business insights

## 📊 Database Schema

### Users Collection
```javascript
{
  uid: string,
  email: string,
  name: string,
  role: 'admin' | 'user',
  department: string,
  isActive: boolean,
  createdAt: timestamp,
  lastLogin: timestamp
}
```

### Tickets Collection
```javascript
{
  id: string,
  title: string,
  description: string,
  status: 'open' | 'in-progress' | 'resolved' | 'closed',
  priority: 'low' | 'medium' | 'high' | 'critical',
  category: string,
  createdBy: string (user ref),
  assignedTo: string (user ref),
  createdAt: timestamp,
  updatedAt: timestamp,
  comments: array
}
```

## �� Design System

### Color Palette
- **Primary**: Emerald (#10B981)
- **Secondary**: Slate (#64748B)
- **Accent**: Cyan (#06B6D4)
- **Success**: Green (#10B981)
- **Warning**: Orange (#F59E0B)
- **Error**: Red (#EF4444)

### Typography
- Clean, professional fonts
- Proper hierarchy and spacing
- Readable text sizes
- Consistent styling

## 📱 Responsive Design

- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interfaces
- Adaptive layouts
- Professional appearance on all devices

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Quality
- ESLint configuration
- Consistent code formatting
- Component-based architecture
- Proper error handling
- Type safety considerations

## 📈 Performance Features

- Server-side rendering (SSR)
- Client-side hydration
- Optimized bundle size
- Lazy loading
- Real-time updates
- Efficient data fetching

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Other Platforms
- Netlify
- Firebase Hosting
- AWS Amplify
- Any Node.js hosting platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## 🎯 Roadmap

- [ ] Email notifications
- [ ] File attachments
- [ ] Advanced search and filtering
- [ ] Mobile app
- [ ] API integration
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Custom workflows

---

Built with ❤️ using Next.js, Firebase, and modern web technologies.

## Environment Variables

This project uses environment variables to secure sensitive configuration data like API keys. 

### Setup for Development

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your actual Firebase configuration values in `.env.local`

### Environment Variables

- `NEXT_PUBLIC_FIREBASE_API_KEY` - Your Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Your Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Your Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Your Firebase app ID

### Security Notes

- Never commit `.env.local` or `.env` files to version control
- The `.env.example` file is safe to commit as it contains no real secrets
- For production deployment, set these environment variables in your hosting platform

