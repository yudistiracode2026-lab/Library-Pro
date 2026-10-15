export function useInitials() {
    // "Muhamad Irfan Yudistira, S.ST., M.Eng" -> "MI": drop academic titles
    // after the first comma, then take the first two words.
    const getInitials = (fullName: string): string => {
        const names = fullName.split(',')[0].trim().split(/\s+/).filter(Boolean);

        return names
            .slice(0, 2)
            .map((name) => name.charAt(0))
            .join('')
            .toUpperCase();
    };

    return getInitials;
}
