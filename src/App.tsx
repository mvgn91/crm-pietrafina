import { Box, Flex, Text, Container, Heading, Button, useDisclosure } from '@chakra-ui/react';

function Header() {
  return (
    <Box as="header" bg="white" boxShadow="sm" py={4} px={8} mb={8}>
      <Flex align="center" justify="space-between">
        <Heading size="md" color="brand.600">CRM Pietrafina</Heading>
        <Button colorScheme="brand" variant="outline" size="sm">Cerrar sesión</Button>
      </Flex>
    </Box>
  );
}


function App() {
  // Aquí puedes usar useDisclosure para modales, menús, etc.
  return (
    <Box minH="100vh" bg="gray.50">
      <Header />
      <Container maxW="container.lg" py={6}>
        {/* Aquí irán las tarjetas de prospección y el contenido principal */}
        <Heading size="lg" mb={6} color="gray.800">Prospección de Clientes</Heading>
        {/* Ejemplo de espacio para tarjetas o componentes principales */}
        <Flex direction="column" gap={4}>
          <Box p={6} bg="white" borderRadius="lg" boxShadow="sm">
            <Text color="gray.600">Aquí irán las tarjetas de prospección...</Text>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}

export default App;
