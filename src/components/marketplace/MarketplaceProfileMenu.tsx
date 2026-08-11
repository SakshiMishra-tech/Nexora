import { useNavigate } from "@tanstack/react-router";
import {
  User,
  Edit,
  Package,
  Heart,
  ThumbsUp,
  Eye,
  ShoppingBag,
  Clock,
  MessageCircle,
  Bell,
  ShieldCheck,
  HelpCircle,
  Settings,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_ROUTES } from "@/lib/auth";

interface MarketplaceProfileMenuProps {
  onClose: () => void;
  displayName: string;
  email: string;
  avatarUrl: string;
  initials: string;
}

export function MarketplaceProfileMenu({
  onClose,
  displayName,
  email,
  avatarUrl,
  initials,
}: MarketplaceProfileMenuProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleNavigate = (path: string) => {
    navigate({ to: path });
    onClose();
  };

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
    onClose();
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-glow animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Profile Header */}
      <div className="border-b border-border bg-gradient-to-br from-primary/5 to-electric/5 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-border">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary text-sm font-black text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-black">{displayName}</p>
            <p className="truncate text-xs font-semibold text-muted-foreground">{email}</p>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="max-h-[500px] overflow-y-auto">
        {/* Account Section */}
        <div className="p-2">
          <div className="mb-1 px-3 py-1">
            <span className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
              Account
            </span>
          </div>
          <MenuItem
            icon={<User className="h-4 w-4" />}
            label="My Profile"
            onClick={() => handleNavigate(AUTH_ROUTES.completeProfile)}
          />
          <MenuItem
            icon={<Edit className="h-4 w-4" />}
            label="Edit Profile"
            onClick={() => handleNavigate(AUTH_ROUTES.completeProfile)}
          />
        </div>

        <Separator />

        {/* Marketplace Section */}
        <div className="p-2">
          <div className="mb-1 px-3 py-1">
            <span className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
              Marketplace
            </span>
          </div>
          <MenuItem
            icon={<Package className="h-4 w-4" />}
            label="My Listings"
            badge="3"
            onClick={() => handleNavigate("/marketplace/my-listings")}
          />
          <MenuItem
            icon={<Heart className="h-4 w-4 text-warm" />}
            label="Saved Items"
            badge="12"
            onClick={() => handleNavigate("/marketplace/saved")}
          />
          <MenuItem
            icon={<ThumbsUp className="h-4 w-4 text-success" />}
            label="Liked Items"
            badge="8"
            onClick={() => handleNavigate("/marketplace/liked")}
          />
          <MenuItem
            icon={<Eye className="h-4 w-4" />}
            label="Recently Viewed"
            onClick={() => handleNavigate("/marketplace/history")}
          />
        </div>

        <Separator />

        {/* Orders Section */}
        <div className="p-2">
          <div className="mb-1 px-3 py-1">
            <span className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
              Orders
            </span>
          </div>
          <MenuItem
            icon={<ShoppingBag className="h-4 w-4" />}
            label="My Orders"
            onClick={() => handleNavigate("/marketplace/orders")}
          />
          <MenuItem
            icon={<Clock className="h-4 w-4" />}
            label="Purchase History"
            onClick={() => handleNavigate("/marketplace/purchases")}
          />
        </div>

        <Separator />

        {/* Communication Section */}
        <div className="p-2">
          <div className="mb-1 px-3 py-1">
            <span className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
              Communication
            </span>
          </div>
          <MenuItem
            icon={<MessageCircle className="h-4 w-4" />}
            label="Chats"
            badge="5"
            highlight
            onClick={() => handleNavigate("/marketplace/chats")}
          />
          <MenuItem
            icon={<Bell className="h-4 w-4" />}
            label="Notifications"
            badge="2"
            highlight
            onClick={() => handleNavigate("/marketplace/notifications")}
          />
        </div>

        <Separator />

        {/* Settings Section */}
        <div className="p-2">
          <div className="mb-1 px-3 py-1">
            <span className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
              Settings
            </span>
          </div>
          <MenuItem
            icon={<ShieldCheck className="h-4 w-4" />}
            label="Campus Verification"
            onClick={() => handleNavigate("/marketplace/verification")}
          />
          <MenuItem
            icon={<Settings className="h-4 w-4" />}
            label="Privacy & Security"
            onClick={() => handleNavigate(AUTH_ROUTES.settings)}
          />
          <MenuItem
            icon={<HelpCircle className="h-4 w-4" />}
            label="Help & Support"
            onClick={() => handleNavigate("/marketplace/help")}
          />
        </div>

        <Separator />

        {/* Logout */}
        <div className="p-2">
          <MenuItem
            icon={<LogOut className="h-4 w-4" />}
            label="Logout"
            onClick={handleLogout}
            danger
          />
        </div>
      </div>
    </div>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  highlight?: boolean;
  danger?: boolean;
  onClick: () => void;
}

function MenuItem({ icon, label, badge, highlight, danger, onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-all duration-200 hover:bg-secondary ${
        danger ? "text-destructive hover:bg-destructive/10" : ""
      }`}
    >
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
          danger
            ? "bg-destructive/10 text-destructive"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {icon}
      </div>
      <span className="flex-1 truncate text-sm font-bold">{label}</span>
      {badge && (
        <span
          className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
            highlight
              ? "bg-warm text-warm-foreground shadow-warm"
              : "bg-primary/10 text-primary"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
