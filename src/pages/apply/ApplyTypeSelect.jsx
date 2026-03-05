import { Briefcase, GraduationCap, Plane, Heart, Clock, ArrowRight } from 'lucide-react';
import { APPLICATION_TYPES } from './applyConfig';

const ICON_MAP = { Briefcase, GraduationCap, Plane, Heart };

export default function ApplyTypeSelect({ onSelectType }) {
  return (
    <div className="step-select">
      <h2>What would you like to apply for?</h2>
      <div className="type-grid">
        {Object.values(APPLICATION_TYPES).map((type) => {
          const IconComponent = ICON_MAP[type.icon] || Briefcase;
          return (
            <button
              key={type.id}
              className="type-card"
              onClick={() => onSelectType(type.id)}
            >
              <div className="type-icon"><IconComponent size={24} /></div>
              <div className="type-info">
                <h3>{type.name}</h3>
                <p>{type.description}</p>
                <div className="type-meta">
                  <span><Clock size={14} /> {type.processingTime}</span>
                  <span>Fee: {type.fee}</span>
                </div>
              </div>
              <ArrowRight size={20} className="type-arrow" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
