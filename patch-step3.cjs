const fs = require('fs');
let code = fs.readFileSync('src/components/CampusConnectProfile.tsx', 'utf8');

// Chunk 1: imports
code = code.replace(
  'RefreshCw\n} from "lucide-react";', 
  'RefreshCw, MapPin\n} from "lucide-react";'
);

// Chunk 2: FormState
code = code.replace(
  'hide_online: boolean; hide_distance: boolean; hide_instagram: boolean; pause_discover: boolean;',
  'hide_online: boolean; hide_distance: boolean; hide_instagram: boolean; pause_discover: boolean;\n  open_to_other_campuses: boolean;'
);

// Chunk 3: profileToForm
code = code.replace(
  '?? true, pause_discover: p.pause_discover ?? false,\n    };',
  '?? true, pause_discover: p.pause_discover ?? false,\n      open_to_other_campuses: true,\n    };'
);

// Chunk 4: emptyForm
code = code.replace(
  'hide_online: false, hide_distance: false, hide_instagram: true, pause_discover: false,\n    };',
  'hide_online: false, hide_distance: false, hide_instagram: true, pause_discover: false,\n      open_to_other_campuses: true,\n    };'
);

// Chunk 5: insert step 3 before main return
const mainReturn = '  return (\n    <div className="min-h-screen bg-background text-foreground flex flex-col">';
const step3Block = `  if (step === 3) {
    const requiredFilled = !!(form.college && form.campus && form.department && form.course && form.year);

    return (
      <div className="flex flex-col h-[100dvh] overflow-hidden bg-background w-full">
         <WizardHeader currentStep={3} onBack={() => setStep(2)} />
         
         <div className="flex flex-col lg:flex-row flex-1 overflow-hidden w-full max-w-[1400px] mx-auto px-6 lg:px-10 pb-6 gap-8">
            {/* LEFT COLUMN: Form */}
            <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col h-full py-2">
               <div className="shrink-0 mb-8">
                 <h1 className="font-display font-black text-4xl lg:text-5xl tracking-tight mb-2">Where's your campus?</h1>
                 <p className="text-muted-foreground text-lg">Tell us where you spend your days. It helps you discover people and experiences around your campus.</p>
               </div>

               <div className="flex-1 overflow-y-auto pr-4 space-y-6">
                  <div>
                    <h3 className="text-xl font-black mb-4">Your campus</h3>
                    <div className="space-y-4">
                      <div>
                        <FieldLabel required>College / University</FieldLabel>
                        <TextInput value={form.college} onChange={(v: string) => set("college", v)} placeholder="Search your college or university" />
                        <FieldError msg={errors.college} />
                      </div>
                      <div>
                        <FieldLabel required>Campus</FieldLabel>
                        <TextInput value={form.campus} onChange={(v: string) => set("campus", v)} placeholder="Select your campus" />
                        <FieldError msg={errors.campus} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border/50">
                    <h3 className="text-lg font-black mb-4">Academic Details</h3>
                    <div className="space-y-4">
                      <div>
                        <FieldLabel required>Department</FieldLabel>
                        <TextInput value={form.department} onChange={(v: string) => set("department", v)} placeholder="e.g. Computer Science & Engineering" />
                        <FieldError msg={errors.department} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <FieldLabel required>Course / Program</FieldLabel>
                          <TextInput value={form.course} onChange={(v: string) => set("course", v)} placeholder="e.g. B.Tech" />
                          <FieldError msg={errors.course} />
                        </div>
                        <div>
                          <FieldLabel required>Current Year</FieldLabel>
                          <SelectInput value={form.year} onChange={(v: string) => set("year", v)} options={YEAR_OPTIONS} placeholder="e.g. 3rd Year" />
                          <FieldError msg={errors.year} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border/50">
                     <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 flex items-center justify-between">
                        <div>
                           <p className="font-bold text-foreground">Campus location</p>
                           <p className="text-sm text-muted-foreground mt-1">{form.college ? (form.college + ", India") : "Select a college first"}</p>
                        </div>
                        <div className="bg-background rounded-full p-2 border border-border/50 shadow-sm">
                           <MapPin className="w-5 h-5 text-primary" />
                        </div>
                     </div>
                  </div>

                  <div className="pt-6 border-t border-border/50 pb-8">
                     <label className="flex items-start gap-4 cursor-pointer group">
                        <div className="flex-1">
                           <p className="font-bold text-foreground">Open to meeting students from other campuses</p>
                           <p className="text-sm text-muted-foreground mt-1 leading-relaxed">Campus Connect can help you discover people beyond your own campus.</p>
                        </div>
                        <div className={\`relative w-12 h-7 rounded-full transition-colors shrink-0 \${form.open_to_other_campuses ? "bg-primary" : "bg-muted border border-border/50"}\`}>
                           <div className={\`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transition-transform \${form.open_to_other_campuses ? "translate-x-5" : ""}\`} />
                        </div>
                        <input type="checkbox" className="hidden" checked={form.open_to_other_campuses} onChange={(e: any) => set("open_to_other_campuses", e.target.checked)} />
                     </label>
                  </div>
               </div>

               <div className="mt-auto pt-6 shrink-0">
                  <button onClick={handleNext} disabled={!requiredFilled} className="w-full py-4 rounded-full bg-primary text-white font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                     Next <ChevronRight className="w-4 h-4" />
                  </button>
               </div>
            </div>

            {/* RIGHT COLUMN: Visual */}
            <div className="hidden lg:block lg:w-[55%] xl:w-[60%] h-full p-2">
               <div className="w-full h-full relative rounded-[2.5rem] overflow-hidden group">
                  <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Campus Life" />
                  
                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                  {/* Floating Campus Card */}
                  <div className="absolute bottom-12 left-12 right-12 flex items-end justify-between">
                     <div className="bg-background/90 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-2xl max-w-sm transform transition-all duration-500 hover:-translate-y-2">
                        <p className="text-xs font-black tracking-widest text-primary uppercase mb-2">Campus Connect</p>
                        <p className="text-2xl font-black leading-tight text-foreground">Your campus, <br/>your people.</p>
                     </div>

                     <div className={\`bg-black/50 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10 shadow-xl flex items-center gap-2 transition-all duration-700 \${form.college ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}\`}>
                        <MapPin className="w-4 h-4 text-white" />
                        <span className="text-sm font-bold text-white">{form.college || "Selected campus"}</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    );
  }\n\n`;
code = code.replace(mainReturn, step3Block + mainReturn);

// Chunk 6: Remove old step 3 from JSX
const step3Start = code.indexOf('          {step === 3 && (');
const step4Start = code.indexOf('          {/* STEP 4: INTERESTS */}');
if (step3Start !== -1 && step4Start !== -1) {
  const oldStep3 = code.substring(step3Start, step4Start);
  code = code.replace(oldStep3, '');
}

fs.writeFileSync('src/components/CampusConnectProfile.tsx', code);
console.log('Script executed successfully!');
