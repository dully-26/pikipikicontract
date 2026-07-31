import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
Bike,
Store,
PlusCircle,
Wallet,
LayoutDashboard,
ClipboardList,
FileBarChart,
Users,
UserPlus,
ScrollText,
LogOut,
ListChecks,
Banknote,
ListOrdered,
FileText,
ShoppingCart,
} from 'lucide-react';

const links = {
user: [
{
to: '/dashboard',
label: 'Dashboard',
icon: LayoutDashboard
},
{
to: '/motorcycles',
label: 'Motorcycles',
icon: Bike
},
{
to: '/my-requests',
label: 'My Requests',
icon: ListChecks
},
{
to: '/marketplace',
label: 'Marketplace',
icon: Store
},
{
to: '/sell',
label: 'Sell Motorcycle',
icon: PlusCircle
},
{
to: '/payments',
label: 'Contracts & Payments',
icon: Wallet
},
],

manager: [
{
to: '/manager',
label: 'Contract Requests',
icon: ClipboardList
},
{
to: '/manager/purchase-requests',
label: 'Purchase Requests',
icon: ShoppingCart
},
{
to: '/manager/contracts',
label: 'All Contracts',
icon: FileText
},
{
to: '/manager/motorcycles',
label: 'Motorcycles',
icon: Bike
},
{
to: '/manager/record-payment',
label: 'Record Payment',
icon: Banknote
},
{
to: '/manager/payment-records',
label: 'Payment Records',
icon: ListOrdered
},
{
to: '/manager/reports',
label: 'Reports',
icon: FileBarChart
},
],

admin: [
{
to: '/admin',
label: 'Dashboard',
icon: LayoutDashboard
},
{
to: '/admin/motorcycles',
label: 'Motorcycles',
icon: Bike
},
{
to: '/admin/users',
label: 'Users',
icon: Users
},
{
to: '/admin/add-manager',
label: 'Add Manager',
icon: UserPlus
},
{
to: '/admin/audit-logs',
label: 'Activity Logs',
icon: ScrollText
},
],
};

export default function Sidebar() {

const { user, logout } = useAuth();

if (!user) return null;

const userLinks = links[user.role] || [];

return ( <aside className="sidebar">

```
  <div className="sidebar-brand">
    🏍️ MotoContract
  </div>

  <div className="sidebar-brand-sub">
    Contract & Sales Manager
  </div>


  <div className="sidebar-section-label">
    Menu
  </div>


  <nav className="sidebar-nav">

    {userLinks.map((l) => {

      const Icon = l.icon;

      return (

        <NavLink
          key={l.to}
          to={l.to}
          end={
            l.to === '/admin' ||
            l.to === '/manager' ||
            l.to === '/dashboard'
          }
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'active' : ''}`
          }
        >

          <Icon size={17} />

          {l.label}

        </NavLink>

      );

    })}

  </nav>


  <button
    className="sidebar-logout"
    onClick={logout}
  >

    <LogOut size={16} />

    Logout

  </button>


</aside>


);
}
