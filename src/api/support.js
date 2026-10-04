import client from "./client";
export const createTicket = (payload) => client.post("/support/tickets", payload);
export const getMyTickets = () => client.get("/support/tickets");
export const replyToTicket = (id, message) =>
  client.post(`/support/tickets/${id}/reply`, { message });
