import prisma from "./prisma";

// Re-export from apiService
export { getNextFeedingTime } from './services/api-feeding-service';

// Buscar gatos
export async function getCats(householdId?: number) {
  try {
    const response = await fetch('/api/cats');
    if (!response.ok) {
      // Attempt to get a meaningful error message
      let errorMsg = `Falha ao buscar gatos (${response.status} ${response.statusText})`;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } else {
          const textError = await response.text();
          console.error("Server returned non-JSON error:", textError);
        }
      } catch (parseOrReadError) {
        console.error("Failed to parse or read error response body:", parseOrReadError);
      }
      throw new Error(errorMsg);
    }

    // Handle potential non-JSON success response
    const contentType = response.headers.get("content-type");
    if (!(contentType && contentType.includes("application/json"))) {
        const textResponse = await response.text();
        console.error("Server returned non-JSON success response:", textResponse);
        throw new Error("Resposta inesperada do servidor ao buscar gatos.");
    }

    try {
        return await response.json();
    } catch (parseError) {
        console.error("Failed to parse successful JSON response:", parseError);
        throw new Error("Falha ao processar a resposta do servidor ao buscar gatos.");
    }

  } catch (error) {
    console.error("Erro ao buscar gatos:", error);
    // Re-throw the error so the caller knows something failed
    throw error;
    // return []; // Avoid masking the error by returning empty array
  }
}

// Buscar um gato pelo ID
export async function getCatById(id: string) {
  try {
    if (!id) return null;

    const cat = await prisma.cats.findUnique({
      where: { id },
      include: {
        household: {
          select: {
            id: true,
            name: true
          }
        },
        feeding_logs: {
          take: 10,
          orderBy: {
            fed_at: 'desc'
          },
          include: {
            feeder: {
              select: {
                id: true,
                full_name: true
              }
            }
          }
        },
        schedules: {
          orderBy: {
            created_at: 'desc'
          }
        }
      }
    });
    
    return cat;
  } catch (error) {
    console.error("Erro ao buscar gato por ID:", error);
    return null;
  }
}

// Buscar registros de alimentação
export async function getFeedingLogs(catId?: number, limit = 20) {
  try {
    // Build the query parameters
    const queryParams = new URLSearchParams();
    if (catId) queryParams.append('catId', catId.toString());
    if (limit) queryParams.append('limit', limit.toString());
    
    // Use the API instead of direct Prisma access
    const url = `/api/feedings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      // Attempt to get a meaningful error message
      let errorMsg = `Falha ao buscar registros de alimentação (${response.status} ${response.statusText})`;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } else {
          const textError = await response.text();
          console.error("Server returned non-JSON error:", textError);
        }
      } catch (parseOrReadError) {
        console.error("Failed to parse or read error response body:", parseOrReadError);
      }
      throw new Error(errorMsg);
    }
    
    // Handle potential non-JSON success response
    const contentType = response.headers.get("content-type");
    if (!(contentType && contentType.includes("application/json"))) {
      const textResponse = await response.text();
      console.error("Server returned non-JSON success response:", textResponse);
      throw new Error("Resposta inesperada do servidor ao buscar registros de alimentação.");
    }
    
    try {
      return await response.json();
    } catch (parseError) {
      console.error("Failed to parse successful JSON response:", parseError);
      throw new Error("Falha ao processar a resposta do servidor ao buscar registros de alimentação.");
    }
  } catch (error) {
    console.error("Erro ao buscar registros de alimentação:", error);
    // Re-throw the error so the caller knows something failed
    throw error;
  }
}

// Buscar agendamentos
export async function getSchedules(catId?: number) {
  try {
    const response = await fetch(`/api/schedules${catId ? `?catId=${catId}` : ''}`);
    if (!response.ok) {
       // Attempt to get a meaningful error message
      let errorMsg = `Falha ao buscar agendamentos (${response.status} ${response.statusText})`;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } else {
          const textError = await response.text();
          console.error("Server returned non-JSON error:", textError);
        }
      } catch (parseOrReadError) {
        console.error("Failed to parse or read error response body:", parseOrReadError);
      }
      throw new Error(errorMsg);
    }

    // Handle potential non-JSON success response
    const contentType = response.headers.get("content-type");
    if (!(contentType && contentType.includes("application/json"))) {
        const textResponse = await response.text();
        console.error("Server returned non-JSON success response:", textResponse);
        throw new Error("Resposta inesperada do servidor ao buscar agendamentos.");
    }

     try {
        return await response.json();
    } catch (parseError) {
        console.error("Failed to parse successful JSON response:", parseError);
        throw new Error("Falha ao processar a resposta do servidor ao buscar agendamentos.");
    }

  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    // Re-throw the error so the caller knows something failed
    throw error;
    // return []; // Avoid masking the error by returning empty array
  }
}
