"use client"
import React from 'react'
import { ClipboardCheck, Hammer, Wrench, Activity, Users } from 'lucide-react'
import { motion } from 'framer-motion'

export default function TaskManagementTabs({ activeTab, setActiveTab }) {
    const role = (localStorage.getItem("role") || "").toLowerCase();
    const designation = (localStorage.getItem("designation") || "").toLowerCase();
    const isMachineOperator = designation.includes("machin") || designation.includes("operat") || designation.includes("oprat");

    const allTabs = [
        { id: 'checklist', label: 'Checklist', icon: ClipboardCheck, color: 'text-leather-700', activeColor: 'bg-leather-800' },
        { id: 'maintenance', label: 'Maintenance', icon: Hammer, color: 'text-leather-600', activeColor: 'bg-leather-700' },
        { id: 'repair', label: 'Repair', icon: Wrench, color: 'text-gold-700', activeColor: 'bg-leather-800' },
        { id: 'ea', label: 'EA', icon: Users, color: 'text-leather-600', activeColor: 'bg-leather-700' },
    ]

    const tabs = allTabs.filter(tab => {
        if (role === "hod") {
            if (tab.id === "checklist") return true;
            if (tab.id === "repair" && isMachineOperator) return true;
            return false;
        }
        return true;
    });

    return (
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-1.5 border border-leather-200 shadow-xs">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-start">
                {/* Navigation Tabs */}
                <div className="w-full lg:w-auto overflow-hidden">
                    <div className="flex bg-cream-100/70 p-1 rounded-xl relative overflow-x-auto no-scrollbar max-w-max">
                        {tabs.map((tab) => {
                            const normalizedActive = activeTab.toLowerCase();
                            const normalizedId = tab.id.toLowerCase();
                            const isActive = normalizedActive === normalizedId || (normalizedActive === 'default' && normalizedId === 'checklist');
                            const Icon = tab.icon;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        relative flex items-center justify-center gap-2.5 py-2 px-6 rounded-lg text-xs font-bold transition-all duration-500 whitespace-nowrap min-w-[100px] md:min-w-[120px] z-10 cursor-pointer
                                        ${isActive ? 'text-cream-100' : 'text-leather-700 hover:text-leather-950'}
                                    `}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTabPillGlobal"
                                            className="absolute inset-0 rounded-lg shadow-sm z-[-1] bg-gradient-to-r from-leather-800 to-leather-700 border border-gold-400/40"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <Icon size={isActive ? 17 : 16} className={`${isActive ? 'text-gold-300' : tab.color} transition-colors duration-300`} />
                                    <span className="relative font-serif">{tab.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
