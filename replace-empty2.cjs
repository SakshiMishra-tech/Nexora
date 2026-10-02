const fs = require('fs');

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
            <div className="flex flex-col items-center justify-center py-6 px-4 text-center w-full max-w-5xl mx-auto min-h-[calc(100vh-160px)] sm:min-h-0">
              <div className="relative mb-6">
                <img 
                  src="/roommates_empty_state.jpg" 
                  alt="Create your first post" 
                  className="w-full max-w-[280px] md:max-w-[420px] h-auto object-contain mix-blend-multiply dark:mix-blend-normal rounded-3xl" 
                />
              </div>
              <h2 className="font-display font-black text-2xl md:text-3xl text-foreground mb-3 tracking-tight">
                Create your first post
              </h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-sm mx-auto mb-10">
                Share your roommate requirements and help others find their perfect match.
              </p>

              <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full mb-10">
                <div className="flex items-center text-left gap-4 p-4 md:p-5 bg-primary/5 rounded-[24px] border border-primary/10 w-full md:w-auto">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm mb-1">Find Compatible Roommates</h3>
                    <p className="text-xs text-muted-foreground leading-snug">Connect with students like you</p>
                  </div>
                </div>
                
                <div className="flex items-center text-left gap-4 p-4 md:p-5 bg-green-500/5 rounded-[24px] border border-green-500/10 w-full md:w-auto">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0">
                    <Home className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm mb-1">Share Your Preferences</h3>
                    <p className="text-xs text-muted-foreground leading-snug">Tell others what you're looking for</p>
                  </div>
                </div>
                
                <div className="flex items-center text-left gap-4 p-4 md:p-5 bg-orange-500/5 rounded-[24px] border border-orange-500/10 w-full md:w-auto">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm mb-1">Build a Safer Community</h3>
                    <p className="text-xs text-muted-foreground leading-snug">Verify and connect with real students</p>
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
                Create Your First Post
              </button>
;

const newContent = content.substring(0, startIdx) + replacement + content.substring(endIdx + endStr.length - 19);

fs.writeFileSync(file, newContent);
console.log('Replaced successfully');
