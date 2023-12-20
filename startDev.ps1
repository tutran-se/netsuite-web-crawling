
# Remove all docker containers
# docker rm -f $(docker ps -a -q)

# # # Remove all docker images
# docker rmi -f $(docker images -q)


# Build and start all docker containers for development
docker-compose -f docker-compose.dev.yml up --build