const fs = require('fs');

let content = fs.readFileSync('src/app/invite/page.tsx', 'utf8').replace(/\r\n/g, '\n');

// Replace TEAM_SELECT
const teamSelectOld = `                {step === 'TEAM_SELECT' && (
                    <div className="w-full animate-fade-in flex flex-col gap-4">
                        <div className="bg-black/80 border border-white/10 p-4 mb-2 text-center">
                            <h2 className="text-[#fbaa19] font-black uppercase tracking-widest text-lg">{dict.team_prompt}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {teams.map(team => (
                                <button
                                    key={team.id}
                                    onClick={() => handleSelectTeam(team.id)}
                                    className="group bg-[#0a0a0a]/95 border-2 border-white/10 hover:border-[#fbaa19] p-6 shadow-xl hover:shadow-[0_0_40px_rgba(251,170,25,0.2)] transition-all flex flex-col"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <LogoBadge code={team.code} />
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }}></div>
                                    </div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-widest text-left mb-1">{team.name}</h3>
                                    <p className="text-xs text-gray-500 font-bold tracking-widest text-left uppercase mb-4" style={{ color: TEAM_COLORS[team.code] || '#999' }}>{team.code}</p>
                                    
                                    <div className="mt-auto flex justify-between items-end w-full">
                                        <span className={\`text-xs font-bold uppercase tracking-widest \${team.is_available ? 'text-green-500' : 'text-red-500'}\`}>
                                            {team.is_available ? \`\${2 - team.spots_taken} Vagas\` : 'Lotado'}
                                        </span>
                                        <span className="text-[10px] text-gray-600 group-hover:text-[#fbaa19] uppercase tracking-widest font-black transition-colors">
                                            SELECT
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}`;

const teamSelectNew = `                {step === 'TEAM_SELECT' && (
                    <div className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative animate-slide-up">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                        
                        <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-6">
                            [ AWAITING INPUT : {dict.team_prompt} ]
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {teams.map((team, idx) => (
                                <button
                                    key={team.id}
                                    onClick={() => handleSelectTeam(team.id)}
                                    className="group w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19]/30 hover:border-[#fbaa19] p-6 hover:bg-[#1a1a1a]/95 transition-all flex flex-col text-left relative overflow-hidden"
                                    style={{ animationDelay: \`\${idx * 100}ms\` }}
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    
                                    <div className="flex justify-between items-start mb-4 w-full relative z-10">
                                        <LogoBadge code={team.code} />
                                        <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: team.color }}></div>
                                    </div>
                                    
                                    <div className="relative z-10 w-full">
                                        <h3 className="text-xl font-black text-white uppercase tracking-widest mb-1 group-hover:text-[#fbaa19] transition-colors">{team.name}</h3>
                                        <p className="text-xs font-bold tracking-widest uppercase mb-6" style={{ color: TEAM_COLORS[team.code] || '#999' }}>{team.code}</p>
                                        
                                        <div className="mt-auto flex justify-between items-end w-full">
                                            <span className={\`text-xs font-bold uppercase tracking-widest \${team.is_available ? 'text-green-500' : 'text-red-500'}\`}>
                                                {team.is_available ? \`\${2 - team.spots_taken} VAGAS LIVRES\` : 'CONTRATO FECHADO'}
                                            </span>
                                        </div>
                                    </div>

                                    {team.is_available && (
                                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[#fbaa19] text-[10px] font-bold tracking-widest uppercase animate-pulse">
                                                [ SELECT ]
                                            </span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}`;

if (content.includes(teamSelectOld)) {
    content = content.replace(teamSelectOld, teamSelectNew);
} else {
    console.log('Failed TEAM_SELECT');
}

// Replace AUTH and PROFILE
const formsOld = `                {(step === 'AUTH' || step === 'PROFILE') && (
                    <div className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 md:p-8 shadow-[0_0_40px_rgba(251,170,25,0.15)] animate-fade-in relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                        
                        {errorMsg && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 flex text-center">
                                <span className="text-red-500 text-xs font-bold uppercase tracking-widest w-full">
                                    {errorMsg}
                                </span>
                            </div>
                        )}

                        {step === 'AUTH' && (
                            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-6">
                                <div className="text-center mb-4">
                                    <p className="text-[#fbaa19] text-sm font-bold uppercase tracking-[0.2em]">{dict.contact_prompt}</p>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <input 
                                        type="text" 
                                        required
                                        placeholder={dict.email_placeholder}
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="bg-[#111] border-2 border-white/10 text-white p-4 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] focus:bg-black transition-all"
                                    />
                                    <input 
                                        type="password" 
                                        required
                                        placeholder={dict.password_placeholder}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="bg-[#111] border-2 border-white/10 text-white p-4 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] focus:bg-black transition-all"
                                    />
                                </div>
                                <button type="submit" className="w-full bg-[#fbaa19] text-black font-black uppercase tracking-[0.3em] p-5 hover:bg-white transition-colors">
                                    {dict.btn_continue}
                                </button>
                            </form>
                        )}

                        {step === 'PROFILE' && (
                            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6">
                                <div className="text-center mb-4">
                                    <p className="text-[#fbaa19] text-sm font-bold uppercase tracking-[0.2em]">{dict.profile_prompt}</p>
                                </div>
                                <div className="flex gap-4">
                                    <input 
                                        type="text" 
                                        required
                                        placeholder={dict.first_name_placeholder}
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                        className="w-1/2 bg-[#111] border-2 border-white/10 text-white p-4 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] focus:bg-black transition-all"
                                    />
                                    <input 
                                        type="text" 
                                        required
                                        placeholder={dict.last_name_placeholder}
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                        className="w-1/2 bg-[#111] border-2 border-white/10 text-white p-4 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] focus:bg-black transition-all"
                                    />
                                </div>
                                <input 
                                    type="number" 
                                    required
                                    min="0" max="99"
                                    placeholder={dict.number_placeholder}
                                    value={raceNumber}
                                    onChange={e => setRaceNumber(e.target.value)}
                                    className="w-full bg-[#111] border-2 border-white/10 text-white p-4 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] focus:bg-black transition-all"
                                />
                                <button type="submit" className="w-full bg-white text-black font-black uppercase tracking-[0.3em] p-5 border-2 border-white hover:bg-transparent hover:text-white transition-colors">
                                    {dict.btn_sign}
                                </button>
                            </form>
                        )}
                    </div>
                )}`;

const formsNew = `                {(step === 'AUTH' || step === 'PROFILE') && (
                    <div className="w-full bg-[#0a0a0a]/95 border-2 border-[#fbaa19] p-6 md:p-8 shadow-[0_0_40px_rgba(251,170,25,0.15)] relative animate-slide-up">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbaa19]/0 via-[#fbaa19] to-[#fbaa19]/0"></div>
                        
                        <p className="text-[#fbaa19] text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-6">
                            [ CREDENTIALS REQUIRED : {step === 'AUTH' ? 'SECURE CHANNEL' : 'PILOT REGISTRATION'} ]
                        </p>
                        
                        {errorMsg && (
                            <div className="mb-6 p-4 bg-red-500/10 border-l-2 border-red-500 flex items-center">
                                <span className="text-red-500 text-xs font-bold uppercase tracking-widest w-full">
                                    ERR: {errorMsg}
                                </span>
                            </div>
                        )}

                        {step === 'AUTH' && (
                            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-6 relative z-10">
                                <div className="mb-2">
                                    <p className="text-white text-lg md:text-xl font-bold uppercase tracking-widest leading-relaxed">
                                        <TypewriterLine text={dict.contact_prompt} startDelay={300} />
                                    </p>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#fbaa19] text-xs font-bold">{">"}</span>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder={dict.email_placeholder}
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="w-full bg-black/50 border-2 border-white/10 text-white p-4 pl-10 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] focus:bg-[#0a0a0a] transition-all placeholder-white/20"
                                        />
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#fbaa19] text-xs font-bold">{">"}</span>
                                        <input 
                                            type="password" 
                                            required
                                            placeholder={dict.password_placeholder}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="w-full bg-black/50 border-2 border-white/10 text-white p-4 pl-10 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] focus:bg-[#0a0a0a] transition-all placeholder-white/20"
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="group relative w-full bg-[#0a0a0a] border-2 border-[#fbaa19] text-[#fbaa19] font-black uppercase tracking-[0.3em] p-5 hover:bg-[#fbaa19] hover:text-black transition-colors overflow-hidden mt-2">
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        [ {dict.btn_continue} ]
                                    </span>
                                </button>
                            </form>
                        )}

                        {step === 'PROFILE' && (
                            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6 relative z-10">
                                <div className="mb-2">
                                    <p className="text-white text-lg md:text-xl font-bold uppercase tracking-widest leading-relaxed">
                                        <TypewriterLine text={dict.profile_prompt} startDelay={300} />
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="relative w-1/2">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#fbaa19] text-xs font-bold">{">"}</span>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder={dict.first_name_placeholder}
                                            value={firstName}
                                            onChange={e => setFirstName(e.target.value)}
                                            className="w-full bg-black/50 border-2 border-white/10 text-white p-4 pl-10 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] focus:bg-[#0a0a0a] transition-all placeholder-white/20"
                                        />
                                    </div>
                                    <div className="relative w-1/2">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#fbaa19] text-xs font-bold">{">"}</span>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder={dict.last_name_placeholder}
                                            value={lastName}
                                            onChange={e => setLastName(e.target.value)}
                                            className="w-full bg-black/50 border-2 border-white/10 text-white p-4 pl-10 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] focus:bg-[#0a0a0a] transition-all placeholder-white/20"
                                        />
                                    </div>
                                </div>
                                <div className="relative w-full">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#fbaa19] text-xs font-bold">{">"}</span>
                                    <input 
                                        type="number" 
                                        required
                                        min="0" max="99"
                                        placeholder={dict.number_placeholder}
                                        value={raceNumber}
                                        onChange={e => setRaceNumber(e.target.value)}
                                        className="w-full bg-black/50 border-2 border-white/10 text-white p-4 pl-10 font-bold uppercase tracking-widest focus:outline-none focus:border-[#fbaa19] focus:bg-[#0a0a0a] transition-all placeholder-white/20"
                                    />
                                </div>
                                <button type="submit" className="group relative w-full bg-[#fbaa19] border-2 border-[#fbaa19] text-black font-black uppercase tracking-[0.3em] p-5 hover:bg-white hover:border-white transition-colors overflow-hidden mt-2">
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        [ {dict.btn_sign} ]
                                    </span>
                                </button>
                            </form>
                        )}
                    </div>
                )}`;

if (content.includes(formsOld)) {
    content = content.replace(formsOld, formsNew);
} else {
    console.log('Failed FORMS');
}

fs.writeFileSync('src/app/invite/page.tsx', content, 'utf8');
console.log('Script done.');
