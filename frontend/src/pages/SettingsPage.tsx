import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/dashboard/Sidebar"
import {
  Settings as SettingsIcon,
  Bell,
  Lock,
  Zap,
  User,
  Save,
  ChevronRight,
  Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SettingsTab {
  id: string
  label: string
  icon: React.ReactNode
}

const settingsTabs: SettingsTab[] = [
  { id: "general", label: "General", icon: <SettingsIcon className="h-4 w-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { id: "security", label: "Security", icon: <Lock className="h-4 w-4" /> },
  { id: "preferences", label: "Preferences", icon: <Zap className="h-4 w-4" /> },
]

interface SettingsState {
  email: string
  name: string
  phone: string
  notifications: {
    breakoutAlerts: boolean
    aiRecommendations: boolean
    marketNewsDigest: boolean
    priceAlerts: boolean
    weeklyReport: boolean
  }
  security: {
    twoFactor: boolean
    apiKey: string
  }
  aiModel: "gpt-4" | "gpt-3.5-turbo"
  preferences: {
    darkMode: boolean
    autoScan: boolean
    defaultTimeframe: "1m" | "5m" | "15m" | "1h" | "daily"
    alertVolume: number
  }
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [settings, setSettings] = useState<SettingsState>({
    email: "user@example.com",
    name: "John Trader",
    phone: "+1 (555) 123-4567",
    notifications: {
      breakoutAlerts: true,
      aiRecommendations: true,
      marketNewsDigest: true,
      priceAlerts: false,
      weeklyReport: true,
    },
    security: {
      twoFactor: false,
      apiKey: "sk-proj-*****",
    },
    aiModel: "gpt-4",
    preferences: {
      darkMode: true,
      autoScan: true,
      defaultTimeframe: "daily",
      alertVolume: 70,
    },
  })

  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  const updateSettings = (path: string[], value: any) => {
    const newSettings = JSON.parse(JSON.stringify(settings)) as typeof settings
    let current: any = newSettings
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]]
    }
    current[path[path.length - 1]] = value
    setSettings(newSettings)
  }

  return (
    <div className="min-h-screen bg-black">
      <Sidebar />

      <div className="ml-64">
        {/* Header */}
        <header className="fixed top-0 left-64 right-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-8">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-sm text-white/60 mt-0.5">Manage your account and preferences</p>
            </div>

            {isSaved && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 animate-in fade-in">
                ✓ Settings saved
              </Badge>
            )}
          </div>
        </header>

        <main className="pt-32 p-8">
          <div className="grid grid-cols-4 gap-6">
            {/* Settings Navigation */}
            <div className="col-span-1">
              <nav className="space-y-1 sticky top-32">
                {settingsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                      activeTab === tab.id
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {activeTab === tab.id && <ChevronRight className="h-4 w-4 ml-auto" />}
                  </button>
                ))}
              </nav>
            </div>

            {/* Settings Content */}
            <div className="col-span-3 space-y-6">
              {/* General Settings */}
              {activeTab === "general" && (
                <Card className="bg-white/[0.02] border-white/10 shadow-xl p-8">
                  <h2 className="text-lg font-semibold text-white mb-6">General Settings</h2>

                  <div className="space-y-6">
                    {/* Profile Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                        <User className="h-4 w-4" /> Profile Information
                      </h3>

                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-white/60 mb-2 block">Full Name</label>
                          <Input
                            value={settings.name}
                            onChange={(e) => updateSettings(["name"], e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>

                        <div>
                          <label className="text-sm text-white/60 mb-2 block">Email Address</label>
                          <Input
                            type="email"
                            value={settings.email}
                            onChange={(e) => updateSettings(["email"], e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>

                        <div>
                          <label className="text-sm text-white/60 mb-2 block">Phone Number</label>
                          <Input
                            type="tel"
                            value={settings.phone}
                            onChange={(e) => updateSettings(["phone"], e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Account Section */}
                    <div className="space-y-4 pt-6 border-t border-white/10">
                      <h3 className="text-sm font-semibold text-white/80">Account Status</h3>
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                        <div>
                          <p className="text-sm font-medium text-white">Membership Tier</p>
                          <p className="text-xs text-white/60">Premium Account</p>
                        </div>
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50">
                          Premium
                        </Badge>
                      </div>
                    </div>

                    <Button
                      onClick={handleSave}
                      className="w-full mt-6 bg-primary text-white hover:bg-primary/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </Card>
              )}

              {/* Notifications Settings */}
              {activeTab === "notifications" && (
                <Card className="bg-white/[0.02] border-white/10 shadow-xl p-8">
                  <h2 className="text-lg font-semibold text-white mb-6">Notification Preferences</h2>

                  <div className="space-y-4">
                    {[
                      {
                        key: "breakoutAlerts" as const,
                        label: "Breakout Alerts",
                        description: "Get notified when new breakout opportunities are detected",
                      },
                      {
                        key: "aiRecommendations" as const,
                        label: "AI Recommendations",
                        description: "Receive AI-powered trading recommendations",
                      },
                      {
                        key: "marketNewsDigest" as const,
                        label: "Market News Digest",
                        description: "Daily summary of market news and events",
                      },
                      {
                        key: "priceAlerts" as const,
                        label: "Price Alerts",
                        description: "Alert when stocks hit your target prices",
                      },
                      {
                        key: "weeklyReport" as const,
                        label: "Weekly Report",
                        description: "Receive your personalized weekly trading report",
                      },
                    ].map(({ key, label, description }) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                        <div>
                          <p className="text-sm font-medium text-white">{label}</p>
                          <p className="text-xs text-white/60">{description}</p>
                        </div>
                        <button
                          onClick={() =>
                            updateSettings(["notifications", key], !settings.notifications[key])
                          }
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            settings.notifications[key] ? "bg-primary" : "bg-white/20"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              settings.notifications[key] ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleSave}
                    className="w-full mt-6 bg-primary text-white hover:bg-primary/90"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </Card>
              )}

              {/* Security Settings */}
              {activeTab === "security" && (
                <Card className="bg-white/[0.02] border-white/10 shadow-xl p-8">
                  <h2 className="text-lg font-semibold text-white mb-6">Security Settings</h2>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-white/80">Two-Factor Authentication</h3>
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                        <div>
                          <p className="text-sm font-medium text-white">Enable 2FA</p>
                          <p className="text-xs text-white/60">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <button
                          onClick={() => updateSettings(["security", "twoFactor"], !settings.security.twoFactor)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            settings.security.twoFactor ? "bg-primary" : "bg-white/20"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              settings.security.twoFactor ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-white/10">
                      <h3 className="text-sm font-semibold text-white/80">API Keys</h3>
                      <div>
                        <label className="text-sm text-white/60 mb-2 block">ChatGPT API Key</label>
                        <div className="flex gap-2">
                          <Input
                            type="password"
                            value={settings.security.apiKey}
                            onChange={(e) => updateSettings(["security", "apiKey"], e.target.value)}
                            placeholder="sk-proj-..."
                            className="bg-white/5 border-white/10 text-white"
                          />
                          <Button variant="outline" size="sm" className="border-white/20">
                            Regenerate
                          </Button>
                        </div>
                        <p className="text-xs text-white/50 mt-2">
                          Your API key is encrypted and never shared
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={handleSave}
                      className="w-full mt-6 bg-primary text-white hover:bg-primary/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Security Settings
                    </Button>
                  </div>
                </Card>
              )}

              {/* Preferences Settings */}
              {activeTab === "preferences" && (
                <Card className="bg-white/[0.02] border-white/10 shadow-xl p-8">
                  <h2 className="text-lg font-semibold text-white mb-6">Trading Preferences</h2>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-white/80">Display Settings</h3>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-white/60" />
                          <span className="text-sm text-white">Dark Mode</span>
                        </div>
                        <button
                          onClick={() => updateSettings(["preferences", "darkMode"], !settings.preferences.darkMode)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            settings.preferences.darkMode ? "bg-primary" : "bg-white/20"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              settings.preferences.darkMode ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-white/10">
                      <h3 className="text-sm font-semibold text-white/80">Scanning</h3>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-white/60" />
                          <span className="text-sm text-white">Auto Scan on Open</span>
                        </div>
                        <button
                          onClick={() =>
                            updateSettings(["preferences", "autoScan"], !settings.preferences.autoScan)
                          }
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            settings.preferences.autoScan ? "bg-primary" : "bg-white/20"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              settings.preferences.autoScan ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>

                      <div>
                        <label className="text-sm text-white/60 mb-2 block">Default Timeframe</label>
                        <select
                          value={settings.preferences.defaultTimeframe}
                          onChange={(e) => updateSettings(["preferences", "defaultTimeframe"], e.target.value)}
                          className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="1m">1 Minute</option>
                          <option value="5m">5 Minutes</option>
                          <option value="15m">15 Minutes</option>
                          <option value="1h">1 Hour</option>
                          <option value="daily">Daily</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-white/10">
                      <h3 className="text-sm font-semibold text-white/80">Audio Alerts</h3>
                      <div>
                        <label className="text-sm text-white/60 mb-3 block">Alert Volume</label>
                        <div className="flex gap-4 items-center">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={settings.preferences.alertVolume}
                            onChange={(e) =>
                              updateSettings(["preferences", "alertVolume"], parseInt(e.target.value))
                            }
                            className="flex-1"
                          />
                          <span className="text-sm font-medium text-white w-8">{settings.preferences.alertVolume}%</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleSave}
                      className="w-full mt-6 bg-primary text-white hover:bg-primary/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
