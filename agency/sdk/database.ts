export const getAgencyDatabaseConfig = () => ({
  url: process.env.DATABASE_URL?.trim() ?? "",
});

export const hasAgencyDatabaseConfig = () => getAgencyDatabaseConfig().url.length > 0;
