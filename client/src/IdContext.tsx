import { createContext, useContext, useState } from 'react';
const IdContext = createContext<{
	uid: string;
	setUid: React.Dispatch<React.SetStateAction<string>>;
} | null>(null);

export function IdProvider({ children }: { children: React.ReactNode }) {
	const [uid, setUid] = useState('no id yet');
	return (
		<IdContext.Provider value={{ uid, setUid }}>{children}</IdContext.Provider>
	);
}
export function useUid() {
	return useContext(IdContext);
}
