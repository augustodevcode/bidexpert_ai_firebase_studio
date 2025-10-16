// src/components/ui/stepper.tsx
'use client';

import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepIconProps {
  icon?: React.ReactNode;
  active?: boolean;
  completed?: boolean;
  error?: boolean;
  className?: string;
}

export interface StepLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  optional?: React.ReactNode;
  StepIconComponent?: React.ComponentType<StepIconProps>;
  error?: boolean;
}

export interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
    active?: boolean;
    completed?: boolean;
    error?: boolean;
    index?: number;
    last?: boolean;
}

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
    activeStep?: number;
    orientation?: 'horizontal' | 'vertical';
    alternativeLabel?: boolean;
}

const StepperContext = React.createContext<{
    activeStep: number;
    orientation: 'horizontal' | 'vertical';
    alternativeLabel: boolean;
}>({ activeStep: 0, orientation: 'horizontal', alternativeLabel: false });

const StepContext = React.createContext<{
    index: number;
    active: boolean;
    completed: boolean;
    error: boolean;
    last: boolean;
}>({ index: 0, active: false, completed: false, error: false, last: false });


export const StepIcon = (props: StepIconProps) => {
    const { completed, active, error, icon } = props;
    
    if (error) {
        return <X className="h-5 w-5 text-destructive" />;
    }
    if (completed) {
        return <Check className="h-5 w-5 text-primary" />;
    }
    if (active) {
         return <div className="h-3 w-3 rounded-full bg-primary" />;
    }

    return <div className="h-3 w-3 rounded-full bg-muted-foreground/30" />;
}

export const StepLabel = React.forwardRef<HTMLSpanElement, StepLabelProps>((props, ref) => {
    const { children, className, StepIconComponent = StepIcon, error, ...other } = props;
    const { active, completed, index } = React.useContext(StepContext);
    
    return (
        <span className={cn("flex items-center", className)} ref={ref} {...other}>
            <span className="mr-2">
                <StepIconComponent completed={completed} active={active} error={error} icon={index + 1} />
            </span>
            {children}
        </span>
    );
});
StepLabel.displayName = 'StepLabel';

export const Step = React.forwardRef<HTMLDivElement, StepProps>((props, ref) => {
    const { children, className, index = 0, last = false, ...other } = props;
    const { activeStep } = React.useContext(StepperContext);
    
    const [active, setActive] = React.useState(false);
    const [completed, setCompleted] = React.useState(false);
    
    React.useEffect(() => {
        setActive(activeStep === index);
        setCompleted(activeStep > index);
    }, [activeStep, index]);
    
    const contextValue = React.useMemo(() => ({ index, active, completed, error: false, last }), [index, active, completed, last]);
    
    return (
        <StepContext.Provider value={contextValue}>
            <div className={cn("flex-1", className)} ref={ref} {...other}>
                {children}
            </div>
        </StepContext.Provider>
    );
});
Step.displayName = 'Step';

const Connector = () => (
    <div className="flex-1 border-t-2 border-border transition-colors"></div>
);

export const Stepper = React.forwardRef<HTMLDivElement, StepperProps>((props, ref) => {
    const { activeStep = 0, orientation = 'horizontal', alternativeLabel = true, children, ...other } = props;

    const childrenArray = React.Children.toArray(children).filter(Boolean);
    const steps = childrenArray.map((step, index) => (
        <Step index={index} last={index + 1 === childrenArray.length} key={(step as React.ReactElement).key || index}>
            {step}
        </Step>
    ));

    const contextValue = React.useMemo(() => ({ activeStep, orientation, alternativeLabel }), [activeStep, orientation, alternativeLabel]);

    return (
        <StepperContext.Provider value={contextValue}>
            <div className={cn("flex", orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col')} ref={ref} {...other}>
                 {steps.map((step, index) => (
                     <React.Fragment key={index}>
                         {step}
                         {index < steps.length - 1 && <Connector />}
                     </React.Fragment>
                 ))}
            </div>
        </StepperContext.Provider>
    );
});
Stepper.displayName = 'Stepper';
