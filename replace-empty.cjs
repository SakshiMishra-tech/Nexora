const fs = require('fs');
const path = require('path');

const file = 'c:/Users/LENOVO/Downloads/Nexora-main/Nexora-main/src/routes/roommates.tsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = '          ) : (\n            <div className=\"flex flex-col items-center justify-center py-10 px-4 text-center min-h-[70vh]\">';
const endStr = '              </div>\n            </div>\n          )\n        )}';

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr, startIdx);

if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find boundaries');
    process.exit(1);
}

const replacement =           ) : (
            <div className="flex flex-col items-center justify-center py-4 md:py-8 px-4 text-center w-full max-w-3xl mx-auto min-h-[calc(100vh-220px)] sm:min-h-0">
              <div className="relative mb-4 md:mb-6">
                <img 
                  src="/roommates_illustration_1790887806516.jpg" 
                  alt="Create your first post" 
                  className="w-full max-w-[280px] md:max-w-[340px] h-auto object-contain mix-blend-multiply dark:mix-blend-normal rounded-3xl" 
                />
              </div>
              <h2 className="font-display font-black text-2xl md:text-3xl text-foreground mb-2 tracking-tight">
                Create your first post
              </h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6 md:mb-8">
                Share your roommate requirements and connect with students who match your preferences.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 w-full mb-8">
                <div className="flex flex-row sm:flex-col items-center sm:items-start text-left gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-[13px] mb-0.5">Find Compatible Roommates</h3>
                    <p className="text-[11px] text-muted-foreground leading-snug">Connect with students like you</p>
                  </div>
                </div>
                
                <div className="flex flex-row sm:flex-col items-center sm:items-start text-left gap-3 p-4 bg-green-500/5 rounded-2xl border border-green-500/10">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                    <Home className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-[13px] mb-0.5">Share Your Preferences</h3>
                    <p className="text-[11px] text-muted-foreground leading-snug">Tell others what you're looking for</p>
                  </div>
                </div>
                
                <div className="flex flex-row sm:flex-col items-center sm:items-start text-left gap-3 p-4 bg-orange-500/5 rounded-2xl border border-orange-500/10">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-[13px] mb-0.5">Build a Safer Community</h3>
                    <p className="text-[11px] text-muted-foreground leading-snug">Verify and connect with real students</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  handleTabChange("myposts");
                  setIsCreatingPost(true);
                }}
                className="px-8 py-3.5 bg-primary text-primary-foreground rounded-full font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Post
              </button>
;

const newContent = content.substring(0, startIdx) + replacement + content.substring(endIdx + endStr.length - 19);

fs.writeFileSync(file, newContent);
console.log('Replaced successfully');
