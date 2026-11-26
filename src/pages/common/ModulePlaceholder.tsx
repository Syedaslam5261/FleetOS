import React from 'react';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { Truck, Fuel, ArrowRight } from 'lucide-react';

interface ModulePlaceholderProps {
  moduleName: string;
  moduleDescription: string;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  moduleName,
  moduleDescription,
}) => {
  const navigate = useNavigate();

  return (
    <div className="py-12 max-w-2xl mx-auto">
      <Card>
        <CardBody className="p-8 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600 shadow-sm">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              FleetOS Modular Roadmap
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-3">{moduleName}</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              {moduleDescription}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-2">
            <p className="font-semibold text-slate-800">
              Current Development Focus: Module 1 — Diesel & Fuel Management
            </p>
            <p className="text-[11px] text-slate-500">
              In accordance with project master instructions, FleetOS is constructed systematically one module at a time. The Diesel Management module is fully interactive and operating.
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Fuel className="w-4 h-4" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => navigate('/diesel')}
            >
              Open Diesel Management Module
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
